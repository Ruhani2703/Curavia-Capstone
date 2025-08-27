const express = require('express');
const router = express.Router();
const mlService = require('../services/mlService');
const mlAnomalyService = require('../services/mlAnomalyService');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const { authenticate, requireDoctorOrSuperAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/ml/anomaly-predictions
 * @desc    Get ML anomaly predictions for all patients
 * @access  Private (Doctor/Admin)
 */
router.get('/anomaly-predictions', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const predictions = await mlAnomalyService.analyzeAllPatients();
    
    res.json({
      success: true,
      predictions,
      timestamp: new Date().toISOString(),
      modelVersion: 'v2.1.3'
    });
  } catch (error) {
    console.error('ML anomaly predictions error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch ML predictions',
      predictions: []
    });
  }
});

/**
 * @route   GET /api/ml/patient-risk/:patientId
 * @desc    Get detailed ML risk analysis for a specific patient
 * @access  Private (Doctor/Admin)
 */
router.get('/patient-risk/:patientId', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { timeWindow } = req.query;
    
    const analysis = await mlAnomalyService.analyzePatientRisk(
      patientId, 
      timeWindow ? parseInt(timeWindow) : 24
    );
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or insufficient data for analysis'
      });
    }
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Patient risk analysis error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to analyze patient risk'
    });
  }
});

/**
 * @route   POST /api/ml/predict
 * @desc    Make ML prediction for vital signs
 * @access  Private
 */
router.post('/predict', authenticate, async (req, res) => {
  try {
    const { heart_rate, spo2, temperature, bp_systolic, bp_diastolic, ecg } = req.body;
    
    const vitalSigns = {
      heart_rate: heart_rate || 0,
      spo2: spo2 || 0,
      temperature: temperature || 0,
      bp_systolic: bp_systolic || 0,
      bp_diastolic: bp_diastolic || 0,
      ecg: ecg || 0
    };
    
    // Get ML prediction
    const prediction = await mlService.predict(vitalSigns);
    
    // Store in database if anomaly detected
    if (prediction.is_anomaly && prediction.severity !== 'low') {
      const alert = new Alert({
        userId: req.user._id,
        type: 'ml_anomaly',
        severity: prediction.severity,
        title: `ML Detected ${prediction.severity} Anomaly`,
        message: prediction.recommendations[0] || 'Anomaly detected in vital signs',
        details: {
          anomaly_types: prediction.anomaly_types,
          risk_score: prediction.risk_score,
          vital_signs: vitalSigns
        },
        mlPrediction: prediction
      });
      
      await alert.save();
    }
    
    res.json({
      success: true,
      prediction,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ml/analyze/:patientId
 * @desc    Analyze historical data for a patient
 * @access  Private
 */
router.get('/analyze/:patientId', authenticate, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { period = '24h' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }
    
    // Fetch sensor data
    const sensorData = await SensorData.find({
      userId: patientId,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: -1 });
    
    if (sensorData.length === 0) {
      return res.json({
        success: true,
        analysis: {
          total_readings: 0,
          anomaly_count: 0,
          message: 'No data available for analysis'
        }
      });
    }
    
    // Prepare data for ML analysis
    const historicalData = sensorData.map(data => ({
      heart_rate: data.heartRate?.value || 0,
      spo2: data.spO2?.value || 0,
      temperature: data.temperature?.value || 0,
      bp_systolic: data.bloodPressure?.systolic || 0,
      bp_diastolic: data.bloodPressure?.diastolic || 0,
      ecg: data.ecg?.value || 0,
      timestamp: data.recordedAt
    }));
    
    // Get batch analysis from ML model
    const analysis = await mlService.analyzeBatch(historicalData);
    
    // Get recent ML predictions for this patient
    const recentAlerts = await Alert.find({
      userId: patientId,
      type: 'ml_anomaly',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 }).limit(10);
    
    // Calculate risk trend
    const predictions = recentAlerts.map(a => a.mlPrediction).filter(p => p);
    const riskTrend = mlService.calculateRiskTrend(patientId, predictions);
    
    res.json({
      success: true,
      analysis,
      riskTrend,
      recentAnomalies: recentAlerts.map(alert => ({
        timestamp: alert.createdAt,
        severity: alert.severity,
        anomaly_types: alert.details?.anomaly_types || [],
        risk_score: alert.details?.risk_score || 0
      })),
      period
    });
    
  } catch (error) {
    console.error('ML analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ml/anomalies
 * @desc    Get all detected anomalies
 * @access  Private
 */
router.get('/anomalies', authenticate, async (req, res) => {
  try {
    const { severity, limit = 50, patientId } = req.query;
    
    let query = { type: 'ml_anomaly' };
    
    if (severity) {
      query.severity = severity;
    }
    
    if (patientId) {
      query.userId = patientId;
    }
    
    const anomalies = await Alert.find(query)
      .populate('userId', 'name patientId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    // Group anomalies by patient
    const groupedAnomalies = {};
    anomalies.forEach(anomaly => {
      const patientKey = anomaly.userId?._id || 'unknown';
      if (!groupedAnomalies[patientKey]) {
        groupedAnomalies[patientKey] = {
          patientName: anomaly.userId?.name || 'Unknown',
          patientId: anomaly.userId?.patientId || 'N/A',
          anomalies: []
        };
      }
      groupedAnomalies[patientKey].anomalies.push({
        id: anomaly._id,
        timestamp: anomaly.createdAt,
        severity: anomaly.severity,
        anomaly_types: anomaly.details?.anomaly_types || [],
        risk_score: anomaly.details?.risk_score || 0,
        message: anomaly.message,
        isResolved: anomaly.isResolved
      });
    });
    
    res.json({
      success: true,
      total: anomalies.length,
      byPatient: Object.values(groupedAnomalies),
      summary: {
        critical: anomalies.filter(a => a.severity === 'critical').length,
        high: anomalies.filter(a => a.severity === 'high').length,
        medium: anomalies.filter(a => a.severity === 'medium').length,
        low: anomalies.filter(a => a.severity === 'low').length
      }
    });
    
  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ml/process-realtime
 * @desc    Process real-time sensor data through ML model
 * @access  Private
 */
router.post('/process-realtime', authenticate, async (req, res) => {
  try {
    const { sensorDataId } = req.body;
    
    // Fetch the sensor data
    const sensorData = await SensorData.findById(sensorDataId);
    
    if (!sensorData) {
      return res.status(404).json({ 
        success: false,
        error: 'Sensor data not found' 
      });
    }
    
    // Process through ML model
    const prediction = await mlService.processSensorData(sensorData);
    
    // Store ML prediction with sensor data
    sensorData.mlPrediction = {
      is_anomaly: prediction.is_anomaly,
      risk_score: prediction.risk_score,
      severity: prediction.severity,
      anomaly_types: prediction.anomaly_types,
      processed_at: new Date()
    };
    
    await sensorData.save();
    
    // Generate insights based on prediction
    const historicalPredictions = await SensorData.find({
      userId: sensorData.userId,
      'mlPrediction.is_anomaly': true,
      recordedAt: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        $lt: sensorData.recordedAt 
      }
    }).select('mlPrediction recordedAt');
    
    const insights = mlService.generateInsights(
      prediction, 
      historicalPredictions.map(d => d.mlPrediction)
    );
    
    res.json({
      success: true,
      prediction,
      insights,
      sensorDataId
    });
    
  } catch (error) {
    console.error('Process real-time data error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ml/dashboard-stats
 * @desc    Get ML statistics for dashboard
 * @access  Private
 */
router.get('/dashboard-stats', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // Get anomaly counts
    const [anomalies24h, anomalies7d, totalAnomalies] = await Promise.all([
      Alert.countDocuments({
        type: 'ml_anomaly',
        createdAt: { $gte: last24h }
      }),
      Alert.countDocuments({
        type: 'ml_anomaly',
        createdAt: { $gte: last7d }
      }),
      Alert.countDocuments({ type: 'ml_anomaly' })
    ]);
    
    // Get severity distribution for last 24h
    const severityDistribution = await Alert.aggregate([
      {
        $match: {
          type: 'ml_anomaly',
          createdAt: { $gte: last24h }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get top anomaly types
    const topAnomalyTypes = await Alert.aggregate([
      {
        $match: {
          type: 'ml_anomaly',
          createdAt: { $gte: last7d }
        }
      },
      { $unwind: '$details.anomaly_types' },
      {
        $group: {
          _id: '$details.anomaly_types',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get patients with most anomalies
    const patientsAtRisk = await Alert.aggregate([
      {
        $match: {
          type: 'ml_anomaly',
          createdAt: { $gte: last7d },
          severity: { $in: ['critical', 'high'] }
        }
      },
      {
        $group: {
          _id: '$userId',
          anomalyCount: { $sum: 1 },
          lastAnomaly: { $max: '$createdAt' }
        }
      },
      { $sort: { anomalyCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'patient'
        }
      },
      { $unwind: '$patient' },
      {
        $project: {
          patientName: '$patient.name',
          patientId: '$patient.patientId',
          anomalyCount: 1,
          lastAnomaly: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: {
        anomalies24h,
        anomalies7d,
        totalAnomalies,
        detectionRate: {
          today: anomalies24h,
          weekly: Math.round(anomalies7d / 7),
          trend: anomalies24h > (anomalies7d / 7) ? 'increasing' : 'decreasing'
        },
        severityDistribution: severityDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topAnomalyTypes: topAnomalyTypes.map(type => ({
          type: type._id,
          count: type.count
        })),
        patientsAtRisk
      }
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;