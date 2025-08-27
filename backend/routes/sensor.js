const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const { authenticate, canAccessPatientData } = require('../middleware/auth');
const { writeToThingSpeak, getChannelStatus, generateTestSensorData } = require('../services/thingspeak');

/**
 * @route   GET /api/sensor/data/:patientId
 * @desc    Get sensor data for a patient
 * @access  Private
 */
router.get('/data/:patientId', authenticate, canAccessPatientData, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    let query = { userId: patientId };
    
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const sensorData = await SensorData.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit));

    res.json({ data: sensorData });
  } catch (error) {
    console.error('Get sensor data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/sensor/latest/:patientId
 * @desc    Get latest sensor reading for a patient
 * @access  Private
 */
router.get('/latest/:patientId', authenticate, canAccessPatientData, async (req, res) => {
  try {
    const { patientId } = req.params;

    const latestData = await SensorData.findOne({ userId: patientId })
      .sort({ recordedAt: -1 });

    if (!latestData) {
      return res.status(404).json({ error: 'No sensor data found' });
    }

    res.json({ data: latestData });
  } catch (error) {
    console.error('Get latest sensor data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/sensor/analytics/:patientId
 * @desc    Get sensor analytics for a patient
 * @access  Private
 */
router.get('/analytics/:patientId', authenticate, canAccessPatientData, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { period = '7d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
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
        startDate.setDate(startDate.getDate() - 7);
    }

    const sensorData = await SensorData.find({
      userId: patientId,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    // Calculate analytics
    const analytics = {
      heartRate: calculateVitalAnalytics(sensorData, 'heartRate'),
      bloodPressure: calculateBPAnalytics(sensorData),
      spO2: calculateVitalAnalytics(sensorData, 'spO2'),
      temperature: calculateVitalAnalytics(sensorData, 'temperature'),
      activity: calculateActivityAnalytics(sensorData),
      dataPoints: sensorData.length,
      period
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get sensor analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/sensor/manual
 * @desc    Manually add sensor data (for testing)
 * @access  Private
 */
router.post('/manual', authenticate, async (req, res) => {
  try {
    const { heartRate, bloodPressure, spO2, temperature, ecg } = req.body;
    
    // Create sensor data
    const sensorData = new SensorData({
      userId: req.user._id,
      bandId: req.user.bandId || 'MANUAL-ENTRY',
      heartRate: { value: heartRate },
      bloodPressure: {
        systolic: bloodPressure?.systolic,
        diastolic: bloodPressure?.diastolic
      },
      spO2: { value: spO2 },
      temperature: { value: temperature },
      ecg: { value: ecg },
      recordedAt: new Date()
    });

    await sensorData.save();

    // Check for alerts
    const alerts = sensorData.checkVitals();
    if (alerts.length > 0) {
      await Alert.insertMany(
        alerts.map(alert => ({
          userId: req.user._id,
          type: 'vital_breach',
          severity: 'high',
          title: alert.message,
          message: alert.message,
          details: { parameter: alert.type, currentValue: alert.value }
        }))
      );
    }

    res.json({ 
      message: 'Sensor data added successfully',
      data: sensorData,
      alerts 
    });
  } catch (error) {
    console.error('Add manual sensor data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/sensor/thingspeak/status
 * @desc    Get ThingSpeak channel status
 * @access  Private
 */
router.get('/thingspeak/status', authenticate, async (req, res) => {
  try {
    const status = await getChannelStatus();
    res.json({ status });
  } catch (error) {
    console.error('Get ThingSpeak status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/sensor-data
 * @desc    Get comprehensive sensor data for analytics dashboard
 * @access  Private (Admin/Doctor only)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { patientId, timeRange = '24h', limit = '1000' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    let shouldAggregate = false;
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '6h':
        startDate.setHours(startDate.getHours() - 6);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        shouldAggregate = true;
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        shouldAggregate = true;
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    // Build query
    let query = { recordedAt: { $gte: startDate } };
    if (patientId && patientId !== 'all') {
      query.userId = patientId;
    }

    // Get sensor data with limit to prevent performance issues
    const dataLimit = parseInt(limit);
    const sensorData = await SensorData.find(query)
      .sort({ recordedAt: 1 })
      .limit(dataLimit)
      .populate('userId', 'name patientId');

    // Get ThingSpeak status
    const thingSpeakStatus = await getChannelStatus();

    // Calculate real-time metrics from latest data
    const latestData = await SensorData.findOne(query)
      .sort({ recordedAt: -1 });

    const realtimeMetrics = {
      heartRate: {
        current: latestData?.heartRate?.value || 0,
        trend: calculateTrend(sensorData.slice(-10).map(d => d.heartRate?.value).filter(v => v))
      },
      bloodPressure: {
        current: latestData?.bloodPressure ? 
          `${latestData.bloodPressure.systolic}/${latestData.bloodPressure.diastolic}` : 'N/A',
        trend: calculateTrend(sensorData.slice(-10).map(d => d.bloodPressure?.systolic).filter(v => v))
      },
      temperature: {
        current: latestData?.temperature?.value || 0,
        trend: calculateTrend(sensorData.slice(-10).map(d => d.temperature?.value).filter(v => v))
      },
      oxygenSat: {
        current: latestData?.spO2?.value || 0,
        trend: calculateTrend(sensorData.slice(-10).map(d => d.spO2?.value).filter(v => v))
      }
    };

    // Calculate quality metrics
    const totalExpectedReadings = Math.floor((new Date() - startDate) / (30 * 1000)); // Every 30 seconds
    const actualReadings = sensorData.length;
    const dataIntegrity = totalExpectedReadings > 0 ? 
      Math.min(100, (actualReadings / totalExpectedReadings) * 100) : 100;
    const missingReadings = Math.max(0, 100 - dataIntegrity);

    const qualityMetrics = {
      dataIntegrity: Math.round(dataIntegrity * 10) / 10,
      missingReadings: Math.round(missingReadings * 10) / 10,
      lastCalibration: '2 days ago' // TODO: Get from system settings
    };

    // Prepare chart data with aggregation for longer time ranges
    let processedData = sensorData;
    
    if (shouldAggregate && sensorData.length > 100) {
      // Aggregate data for longer time ranges to reduce chart complexity
      const aggregationInterval = timeRange === '7d' ? 6 : 24; // hours
      processedData = aggregateDataByHours(sensorData, aggregationInterval);
    } else if (sensorData.length > 200) {
      // Sample data points to keep charts responsive
      const sampleRate = Math.ceil(sensorData.length / 200);
      processedData = sensorData.filter((_, index) => index % sampleRate === 0);
    }

    const chartData = {
      heartRate: {
        categories: processedData.map(d => new Date(d.recordedAt).toLocaleTimeString('en-US', { 
          hour12: false, hour: '2-digit', minute: '2-digit' 
        })),
        series: [{
          name: 'Heart Rate',
          data: processedData.map(d => d.heartRate?.value || 0)
        }]
      },
      vitals: {
        categories: processedData.map(d => 
          new Date(d.recordedAt).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit' 
          })
        ),
        series: [
          {
            name: 'Temperature (°F)',
            data: processedData.map(d => d.temperature?.value || 0)
          },
          {
            name: 'Oxygen Sat (%)',
            data: processedData.map(d => d.spO2?.value || 0)
          }
        ]
      }
    };

    res.json({
      thingSpeakStatus: {
        status: thingSpeakStatus?.status || 'offline',
        lastUpdate: latestData ? 
          `${Math.floor((new Date() - new Date(latestData.recordedAt)) / 1000)} seconds ago` : 
          'Unknown',
        channelId: '3008199',
        fieldsActive: thingSpeakStatus?.fieldsActive || 0,
        dataPoints: actualReadings
      },
      realtimeMetrics,
      qualityMetrics,
      chartData
    });

  } catch (error) {
    console.error('Get sensor analytics data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/sensor/generate-test-data
 * @desc    Generate test sensor data for demonstration
 * @access  Private (Admin only)
 */
router.post('/generate-test-data', authenticate, async (req, res) => {
  try {
    // Only allow admins to generate test data
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const testData = await generateTestSensorData();
    
    if (testData) {
      res.json({ 
        message: 'Test sensor data generated successfully',
        data: testData
      });
    } else {
      res.status(400).json({ error: 'Failed to generate test data' });
    }
  } catch (error) {
    console.error('Generate test data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculateVitalAnalytics(data, vitalType) {
  if (!data || data.length === 0) {
    return { min: 0, max: 0, average: 0, trend: 'stable' };
  }

  const values = data.map(d => d[vitalType]?.value).filter(v => v !== undefined);
  
  if (values.length === 0) {
    return { min: 0, max: 0, average: 0, trend: 'stable' };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate trend (simple linear regression)
  const trend = calculateTrend(values);

  return {
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    average: Math.round(average * 10) / 10,
    trend,
    data: values.map((v, i) => ({
      value: v,
      timestamp: data[i].recordedAt
    }))
  };
}

function calculateBPAnalytics(data) {
  if (!data || data.length === 0) {
    return { 
      systolic: { min: 0, max: 0, average: 0 },
      diastolic: { min: 0, max: 0, average: 0 },
      trend: 'stable'
    };
  }

  const systolicValues = data.map(d => d.bloodPressure?.systolic).filter(v => v);
  const diastolicValues = data.map(d => d.bloodPressure?.diastolic).filter(v => v);

  return {
    systolic: {
      min: Math.min(...systolicValues),
      max: Math.max(...systolicValues),
      average: Math.round(systolicValues.reduce((a, b) => a + b, 0) / systolicValues.length)
    },
    diastolic: {
      min: Math.min(...diastolicValues),
      max: Math.max(...diastolicValues),
      average: Math.round(diastolicValues.reduce((a, b) => a + b, 0) / diastolicValues.length)
    },
    trend: calculateTrend(systolicValues),
    data: systolicValues.map((v, i) => ({
      systolic: v,
      diastolic: diastolicValues[i],
      timestamp: data[i].recordedAt
    }))
  };
}

function calculateActivityAnalytics(data) {
  const steps = data.map(d => d.movement?.steps || 0);
  const totalSteps = steps.reduce((a, b) => a + b, 0);
  const avgSteps = steps.length > 0 ? totalSteps / steps.length : 0;

  return {
    totalSteps,
    averageSteps: Math.round(avgSteps),
    maxSteps: Math.max(...steps, 0),
    data: steps.map((v, i) => ({
      steps: v,
      timestamp: data[i].recordedAt
    }))
  };
}

function calculateTrend(values) {
  if (values.length < 2) return 'stable';
  
  // Simple trend calculation
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  const percentChange = (difference / firstAvg) * 100;
  
  if (percentChange > 5) return 'increasing';
  if (percentChange < -5) return 'decreasing';
  return 'stable';
}

function aggregateDataByHours(data, intervalHours) {
  if (!data || data.length === 0) return [];
  
  const aggregated = [];
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // Group data by time intervals
  const groups = {};
  
  data.forEach(record => {
    const recordTime = new Date(record.recordedAt);
    const intervalStart = new Date(Math.floor(recordTime.getTime() / intervalMs) * intervalMs);
    const key = intervalStart.toISOString();
    
    if (!groups[key]) {
      groups[key] = {
        records: [],
        timestamp: intervalStart
      };
    }
    groups[key].records.push(record);
  });
  
  // Calculate averages for each group
  Object.values(groups).forEach(group => {
    const records = group.records;
    const heartRates = records.map(r => r.heartRate?.value).filter(v => v);
    const temperatures = records.map(r => r.temperature?.value).filter(v => v);
    const spO2Values = records.map(r => r.spO2?.value).filter(v => v);
    const systolicBP = records.map(r => r.bloodPressure?.systolic).filter(v => v);
    const diastolicBP = records.map(r => r.bloodPressure?.diastolic).filter(v => v);
    
    // Calculate averages
    const avgHeartRate = heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : 0;
    const avgTemperature = temperatures.length > 0 ? temperatures.reduce((a, b) => a + b, 0) / temperatures.length : 0;
    const avgSpO2 = spO2Values.length > 0 ? spO2Values.reduce((a, b) => a + b, 0) / spO2Values.length : 0;
    const avgSystolic = systolicBP.length > 0 ? systolicBP.reduce((a, b) => a + b, 0) / systolicBP.length : 0;
    const avgDiastolic = diastolicBP.length > 0 ? diastolicBP.reduce((a, b) => a + b, 0) / diastolicBP.length : 0;
    
    aggregated.push({
      recordedAt: group.timestamp,
      userId: records[0].userId,
      heartRate: { value: Math.round(avgHeartRate * 10) / 10 },
      temperature: { value: Math.round(avgTemperature * 10) / 10 },
      spO2: { value: Math.round(avgSpO2 * 10) / 10 },
      bloodPressure: {
        systolic: Math.round(avgSystolic),
        diastolic: Math.round(avgDiastolic)
      }
    });
  });
  
  return aggregated.sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
}

module.exports = router;