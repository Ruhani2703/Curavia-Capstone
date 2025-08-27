const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { authenticate, canAccessPatientData, requireDoctorOrSuperAdmin } = require('../middleware/auth');

/**
 * @route   POST /api/report/generate
 * @desc    Generate a new report for a patient
 * @access  Private (Doctor, Admin)
 */
router.post('/generate', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { patientId, type = 'monthly', startDate, endDate } = req.body;

    // Validate patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Calculate date range
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      switch (type) {
        case 'weekly':
          start.setDate(start.getDate() - 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() - 1);
          break;
        case 'quarterly':
          start.setMonth(start.getMonth() - 3);
          break;
        default:
          start.setMonth(start.getMonth() - 1);
      }
    }

    // Fetch data for report
    const [sensorData, alerts, previousReport] = await Promise.all([
      SensorData.find({
        userId: patientId,
        recordedAt: { $gte: start, $lte: end }
      }).sort({ recordedAt: 1 }),
      
      Alert.find({
        userId: patientId,
        createdAt: { $gte: start, $lte: end }
      }),
      
      Report.findOne({
        userId: patientId,
        'period.endDate': { $lt: start }
      }).sort({ 'period.endDate': -1 })
    ]);

    // Calculate statistics
    const vitalStats = calculateVitalStatistics(sensorData);
    const activityMetrics = calculateActivityMetrics(sensorData);
    const medicationAdherence = calculateMedicationAdherence(patient, start, end);
    const alertsSummary = calculateAlertsSummary(alerts);
    const recoveryProgress = calculateRecoveryProgress(patient, vitalStats, activityMetrics);

    // Generate recommendations
    const recommendations = generateRecommendations(vitalStats, activityMetrics, alertsSummary);

    // Create report
    const report = new Report({
      userId: patientId,
      type,
      period: { startDate: start, endDate: end },
      vitalStatistics: vitalStats,
      activityMetrics,
      medicationAdherence,
      alertsSummary,
      recoveryProgress,
      recommendations,
      riskAssessment: assessRisk(vitalStats, alertsSummary),
      generatedBy: req.user._id
    });

    await report.save();

    res.status(201).json({
      message: 'Report generated successfully',
      report
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/report/patient/:patientId
 * @desc    Get reports for a patient
 * @access  Private
 */
router.get('/patient/:patientId', authenticate, canAccessPatientData, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10 } = req.query;

    const reports = await Report.find({ userId: patientId })
      .populate('generatedBy', 'name role')
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit));

    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/report/:reportId
 * @desc    Get specific report
 * @access  Private
 */
router.get('/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('userId', 'name patientId surgeryType')
      .populate('generatedBy', 'name role');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check access permissions
    if (req.user.role === 'patient' && report.userId && report.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Format admin reports
    if (report.adminReportData) {
      res.json({
        success: true,
        report: {
          id: report._id,
          type: report.type,
          generatedAt: report.generatedAt,
          generatedBy: report.generatedBy,
          period: report.period,
          metadata: report.metadata,
          data: report.adminReportData
        }
      });
    } else {
      res.json({ success: true, report });
    }
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/report/:reportId/download
 * @desc    Download report as JSON or PDF
 * @access  Private
 */
router.get('/:reportId/download', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'json' } = req.query;

    const report = await Report.findById(reportId)
      .populate('userId', 'name patientId surgeryType')
      .populate('generatedBy', 'name role');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check access permissions
    if (req.user.role === 'patient' && report.userId && report.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (format.toLowerCase() === 'json') {
      // Format filename
      const reportType = report.type.replace(/_/g, '-');
      const timestamp = new Date(report.generatedAt).toISOString().split('T')[0];
      const filename = `${reportType}-${timestamp}.json`;

      // Set headers for download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send report data
      if (report.adminReportData) {
        res.json({
          reportId: report._id,
          type: report.type,
          generatedAt: report.generatedAt,
          generatedBy: report.generatedBy?.name || 'System',
          period: report.period,
          metadata: report.metadata,
          data: report.adminReportData
        });
      } else {
        res.json(report);
      }
    } else if (format.toLowerCase() === 'csv') {
      // Generate CSV format for data export
      const reportType = report.type.replace(/_/g, '-');
      const timestamp = new Date(report.generatedAt).toISOString().split('T')[0];
      const filename = `${reportType}-${timestamp}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Convert report data to CSV
      const csvData = convertReportToCSV(report);
      res.send(csvData);
    } else {
      res.status(400).json({ error: 'Unsupported format. Use json or csv.' });
    }
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/report/:reportId/notes
 * @desc    Add doctor notes to report
 * @access  Private (Doctor, Admin)
 */
router.put('/:reportId/notes', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { note } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.doctorNotes.push({
      note,
      addedBy: req.user._id,
      addedAt: new Date()
    });

    report.lastModified = new Date();
    await report.save();

    res.json({
      message: 'Note added successfully',
      report
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/report/admin/analytics
 * @desc    Get comprehensive analytics for admin reports
 * @access  Private (Admin only)
 */
router.get('/admin/analytics', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get comprehensive system analytics
    const [
      totalPatients,
      totalReports,
      systemHealth,
      mlInsights,
      alertAnalytics,
      performanceMetrics
    ] = await Promise.all([
      getPatientAnalytics(startDate, endDate),
      getReportAnalytics(startDate, endDate),
      getSystemHealthMetrics(startDate, endDate),
      getMLInsights(startDate, endDate),
      getAlertAnalytics(startDate, endDate),
      getPerformanceMetrics(startDate, endDate)
    ]);

    res.json({
      success: true,
      analytics: {
        totalPatients,
        totalReports,
        systemHealth,
        mlInsights,
        alertAnalytics,
        performanceMetrics
      },
      timeRange,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/report/admin/dashboard-reports
 * @desc    Get all reports for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/admin/dashboard-reports', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all', status = 'all' } = req.query;
    
    let query = {};
    
    if (type !== 'all') {
      query.type = type;
    }
    
    if (status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('userId', 'name patientId email')
      .populate('generatedBy', 'name role')
      .sort({ generatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalReports = await Report.countDocuments(query);

    // Format reports for admin dashboard
    const formattedReports = reports.map(report => ({
      id: report._id,
      name: `${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report - ${report.userId?.name || 'Unknown'}`,
      description: `Health analytics report for ${report.period?.startDate ? new Date(report.period.startDate).toLocaleDateString() : 'N/A'} to ${report.period?.endDate ? new Date(report.period.endDate).toLocaleDateString() : 'N/A'}`,
      type: report.type,
      status: 'completed',
      format: 'JSON',
      size: `${Math.round(JSON.stringify(report).length / 1024)}KB`,
      createdAt: report.generatedAt,
      createdBy: report.generatedBy?.name || 'System',
      patient: {
        name: report.userId?.name || 'Unknown',
        patientId: report.userId?.patientId || 'N/A'
      }
    }));

    res.json({
      success: true,
      reports: formattedReports,
      pagination: {
        total: totalReports,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalReports / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Dashboard reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/report/admin/generate
 * @desc    Generate comprehensive admin reports
 * @access  Private (Admin only)
 */
router.post('/admin/generate', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { 
      reportType, 
      timeRange, 
      includeCharts = true, 
      includeRawData = false,
      emailRecipients = []
    } = req.body;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Generate report based on type
    let reportData;
    switch (reportType) {
      case 'Patient Recovery Analysis':
        reportData = await generatePatientRecoveryReport(startDate, endDate, includeCharts, includeRawData);
        break;
      case 'System Performance Report':
        reportData = await generateSystemPerformanceReport(startDate, endDate, includeCharts, includeRawData);
        break;
      case 'Emergency Response Analytics':
        reportData = await generateEmergencyResponseReport(startDate, endDate, includeCharts, includeRawData);
        break;
      case 'HIPAA Compliance Report':
        reportData = await generateComplianceReport(startDate, endDate, includeCharts, includeRawData);
        break;
      case 'Revenue Analytics':
        reportData = await generateRevenueReport(startDate, endDate, includeCharts, includeRawData);
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Create admin report record
    const adminReport = new Report({
      userId: null, // Admin-level report
      type: 'admin_' + reportType.toLowerCase().replace(/\s+/g, '_'),
      period: { startDate, endDate },
      adminReportData: reportData,
      generatedBy: req.user._id,
      metadata: {
        reportType,
        includeCharts,
        includeRawData,
        emailRecipients
      }
    });

    await adminReport.save();

    res.json({
      success: true,
      message: 'Report generated successfully',
      reportId: adminReport._id,
      reportData,
      estimatedDelivery: '5-10 minutes'
    });
  } catch (error) {
    console.error('Generate admin report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/report/:reportId/share
 * @desc    Share report with another user
 * @access  Private
 */
router.post('/:reportId/share', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { userId, accessLevel = 'view' } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if user owns the report or is admin
    if (req.user.role !== 'admin' && report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add share entry
    report.sharedWith.push({
      userId,
      sharedAt: new Date(),
      accessLevel
    });

    await report.save();

    res.json({
      message: 'Report shared successfully',
      report
    });
  } catch (error) {
    console.error('Share report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculateVitalStatistics(sensorData) {
  if (!sensorData || sensorData.length === 0) {
    return {
      heartRate: { average: 0, min: 0, max: 0, trend: 'stable' },
      bloodPressure: { 
        averageSystolic: 0, averageDiastolic: 0,
        minSystolic: 0, maxSystolic: 0,
        minDiastolic: 0, maxDiastolic: 0,
        trend: 'stable'
      },
      spO2: { average: 0, min: 0, max: 0, trend: 'stable' },
      temperature: { average: 0, min: 0, max: 0, trend: 'stable' }
    };
  }

  const heartRates = sensorData.map(d => d.heartRate.value).filter(v => v);
  const systolicBP = sensorData.map(d => d.bloodPressure?.systolic).filter(v => v);
  const diastolicBP = sensorData.map(d => d.bloodPressure?.diastolic).filter(v => v);
  const spO2Values = sensorData.map(d => d.spO2.value).filter(v => v);
  const temperatures = sensorData.map(d => d.temperature.value).filter(v => v);

  return {
    heartRate: {
      average: Math.round(average(heartRates)),
      min: Math.min(...heartRates),
      max: Math.max(...heartRates),
      trend: calculateTrend(heartRates)
    },
    bloodPressure: {
      averageSystolic: Math.round(average(systolicBP)),
      averageDiastolic: Math.round(average(diastolicBP)),
      minSystolic: Math.min(...systolicBP),
      maxSystolic: Math.max(...systolicBP),
      minDiastolic: Math.min(...diastolicBP),
      maxDiastolic: Math.max(...diastolicBP),
      trend: calculateTrend(systolicBP)
    },
    spO2: {
      average: Math.round(average(spO2Values)),
      min: Math.min(...spO2Values),
      max: Math.max(...spO2Values),
      trend: calculateTrend(spO2Values)
    },
    temperature: {
      average: Math.round(average(temperatures) * 10) / 10,
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      trend: calculateTrend(temperatures)
    }
  };
}

function calculateActivityMetrics(sensorData) {
  const steps = sensorData.map(d => d.movement?.steps || 0).filter(v => v);
  const totalSteps = steps.reduce((a, b) => a + b, 0);
  
  return {
    totalSteps,
    averageDailySteps: Math.round(totalSteps / 30), // Assuming monthly
    activeMinutes: Math.round(totalSteps / 100), // Rough estimate
    sedentaryHours: 12, // Mock data
    caloriesBurned: Math.round(totalSteps * 0.04), // Rough estimate
    distanceCovered: Math.round(totalSteps * 0.0008), // km
    exerciseCompletionRate: 75 // Mock data
  };
}

function calculateMedicationAdherence(patient, startDate, endDate) {
  // Mock calculation - in production, track actual medication intake
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const medications = patient.medications || [];
  const totalDoses = medications.length * totalDays * 2; // Assuming 2 doses per day
  const takenDoses = Math.floor(totalDoses * 0.85); // 85% adherence mock

  return {
    totalDoses,
    takenDoses,
    missedDoses: totalDoses - takenDoses,
    adherenceRate: Math.round((takenDoses / totalDoses) * 100),
    medications: medications.map(med => ({
      name: med.name,
      adherenceRate: Math.round(Math.random() * 20 + 80), // 80-100% mock
      missedDoses: Math.floor(Math.random() * 5)
    }))
  };
}

function calculateAlertsSummary(alerts) {
  const summary = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    averageResponseTime: 0,
    mostCommonTypes: []
  };

  // Calculate average response time
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved' && a.resolvedAt);
  if (resolvedAlerts.length > 0) {
    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      return sum + (alert.resolvedAt - alert.createdAt) / 1000 / 60; // in minutes
    }, 0);
    summary.averageResponseTime = Math.round(totalTime / resolvedAlerts.length);
  }

  // Find most common alert types
  const typeCounts = {};
  alerts.forEach(alert => {
    typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
  });
  
  summary.mostCommonTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return summary;
}

function calculateRecoveryProgress(patient, vitalStats, activityMetrics) {
  const daysSinceSurgery = Math.floor((Date.now() - new Date(patient.surgeryDate)) / (1000 * 60 * 60 * 24));
  const expectedDays = patient.expectedRecoveryTime || 90;
  const expectedProgress = Math.min((daysSinceSurgery / expectedDays) * 100, 100);
  
  // Calculate actual progress based on various factors
  let actualProgress = 0;
  let factors = 0;

  // Vital signs stability (40%)
  if (vitalStats.heartRate.trend === 'stable') actualProgress += 20;
  if (vitalStats.bloodPressure.trend === 'stable') actualProgress += 20;
  
  // Activity level (30%)
  if (activityMetrics.averageDailySteps > 5000) actualProgress += 30;
  else actualProgress += (activityMetrics.averageDailySteps / 5000) * 30;
  
  // Medication adherence (30%) - mock for now
  actualProgress += 25;

  let status = 'on_track';
  if (actualProgress > expectedProgress + 10) status = 'ahead_of_schedule';
  else if (actualProgress < expectedProgress - 10) status = 'slightly_behind';
  else if (actualProgress < expectedProgress - 20) status = 'significantly_behind';

  return {
    currentProgress: Math.round(actualProgress),
    expectedProgress: Math.round(expectedProgress),
    status,
    milestones: [
      { name: 'Initial Recovery', achieved: true, achievedDate: new Date(patient.surgeryDate) },
      { name: '25% Recovery', achieved: actualProgress >= 25, expectedDate: new Date() },
      { name: '50% Recovery', achieved: actualProgress >= 50, expectedDate: new Date() },
      { name: '75% Recovery', achieved: actualProgress >= 75, expectedDate: new Date() },
      { name: 'Full Recovery', achieved: actualProgress >= 100, expectedDate: new Date() }
    ]
  };
}

function generateRecommendations(vitalStats, activityMetrics, alertsSummary) {
  const recommendations = {
    diet: [],
    exercise: [],
    medication: [],
    lifestyle: [],
    followUp: ''
  };

  // Diet recommendations based on vitals
  if (vitalStats.bloodPressure.averageSystolic > 130) {
    recommendations.diet.push('Reduce sodium intake');
    recommendations.diet.push('Increase potassium-rich foods');
  }
  if (vitalStats.heartRate.average > 80) {
    recommendations.diet.push('Limit caffeine consumption');
  }

  // Exercise recommendations
  if (activityMetrics.averageDailySteps < 5000) {
    recommendations.exercise.push('Gradually increase daily walking');
    recommendations.exercise.push('Aim for 5000 steps per day');
  }

  // Medication recommendations
  if (alertsSummary.mostCommonTypes.find(t => t.type === 'medication_reminder')) {
    recommendations.medication.push('Set multiple reminders for medications');
    recommendations.medication.push('Consider using a pill organizer');
  }

  // Lifestyle recommendations
  recommendations.lifestyle.push('Maintain regular sleep schedule');
  recommendations.lifestyle.push('Stay hydrated');
  
  // Follow-up
  if (alertsSummary.critical > 0) {
    recommendations.followUp = 'Schedule immediate consultation with doctor';
  } else if (alertsSummary.high > 5) {
    recommendations.followUp = 'Schedule follow-up within a week';
  } else {
    recommendations.followUp = 'Regular monthly check-up recommended';
  }

  return recommendations;
}

function assessRisk(vitalStats, alertsSummary) {
  let riskScore = 0;
  const factors = [];

  // Assess based on vital trends
  if (vitalStats.heartRate.trend === 'increasing') {
    riskScore += 20;
    factors.push({ factor: 'Heart rate trend', level: 'medium', recommendation: 'Monitor closely' });
  }
  
  if (vitalStats.bloodPressure.averageSystolic > 140) {
    riskScore += 30;
    factors.push({ factor: 'High blood pressure', level: 'high', recommendation: 'Medication review needed' });
  }

  // Assess based on alerts
  if (alertsSummary.critical > 0) {
    riskScore += 40;
    factors.push({ factor: 'Critical alerts', level: 'high', recommendation: 'Immediate attention required' });
  }

  let overallRisk = 'low';
  if (riskScore > 60) overallRisk = 'high';
  else if (riskScore > 30) overallRisk = 'medium';

  return { overallRisk, factors };
}

function average(arr) {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function calculateTrend(values) {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = average(firstHalf);
  const secondAvg = average(secondHalf);
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (percentChange > 5) return 'improving';
  if (percentChange < -5) return 'declining';
  return 'stable';
}

// Admin Report Generation Helper Functions
async function getPatientAnalytics(startDate, endDate) {
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const newPatients = await User.countDocuments({ 
    role: 'patient', 
    createdAt: { $gte: startDate, $lte: endDate } 
  });
  
  const activePatients = await SensorData.distinct('userId', {
    recordedAt: { $gte: startDate, $lte: endDate }
  });

  return {
    total: totalPatients,
    new: newPatients,
    active: activePatients.length,
    inactive: totalPatients - activePatients.length,
    growthRate: totalPatients > 0 ? Math.round((newPatients / totalPatients) * 100) : 0
  };
}

async function getReportAnalytics(startDate, endDate) {
  const totalReports = await Report.countDocuments({
    generatedAt: { $gte: startDate, $lte: endDate }
  });
  
  const reportsByType = await Report.aggregate([
    { $match: { generatedAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  return {
    total: totalReports,
    byType: reportsByType,
    averagePerDay: Math.round(totalReports / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))
  };
}

async function getSystemHealthMetrics(startDate, endDate) {
  const totalAlerts = await Alert.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  const criticalAlerts = await Alert.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    severity: 'critical'
  });

  return {
    uptime: 99.8, // Mock system uptime percentage
    totalAlerts,
    criticalAlerts,
    responseTime: 1.2, // Average response time in seconds
    systemLoad: 23, // System load percentage
    healthScore: Math.max(100 - (criticalAlerts * 5) - (totalAlerts * 0.1), 0)
  };
}

async function getMLInsights(startDate, endDate) {
  const mlAlerts = await Alert.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate },
    type: 'ml_anomaly'
  });

  const totalPredictions = await SensorData.countDocuments({
    recordedAt: { $gte: startDate, $lte: endDate },
    'mlPrediction.is_anomaly': { $exists: true }
  });

  return {
    totalPredictions,
    anomaliesDetected: mlAlerts,
    accuracy: 94.2, // Mock ML model accuracy
    falsePositiveRate: 2.1, // Mock false positive rate
    modelVersion: 'v2.1.3',
    lastUpdated: '2024-01-15T10:30:00Z'
  };
}

async function getAlertAnalytics(startDate, endDate) {
  const alerts = await Alert.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const severityBreakdown = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length
  };

  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const averageResolutionTime = resolvedAlerts.length > 0 
    ? resolvedAlerts.reduce((sum, alert) => {
        return sum + (alert.resolvedAt - alert.createdAt) / 1000 / 60; // in minutes
      }, 0) / resolvedAlerts.length
    : 0;

  return {
    total: alerts.length,
    severityBreakdown,
    resolved: resolvedAlerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    averageResolutionTime: Math.round(averageResolutionTime)
  };
}

async function getPerformanceMetrics(startDate, endDate) {
  const sensorDataCount = await SensorData.countDocuments({
    recordedAt: { $gte: startDate, $lte: endDate }
  });

  return {
    dataPointsProcessed: sensorDataCount,
    apiRequestsPerDay: Math.round(sensorDataCount / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))),
    averageResponseTime: 245, // milliseconds
    throughput: 1440, // requests per hour
    errorRate: 0.02 // 0.02% error rate
  };
}

// Specific Report Generators
async function generatePatientRecoveryReport(startDate, endDate, includeCharts, includeRawData) {
  const patients = await User.find({ role: 'patient' });
  const recoveryData = [];

  for (const patient of patients.slice(0, 10)) { // Limit for performance
    const sensorData = await SensorData.find({
      userId: patient._id,
      recordedAt: { $gte: startDate, $lte: endDate }
    });

    const vitalStats = calculateVitalStatistics(sensorData);
    const recoveryProgress = calculateRecoveryProgress(patient, vitalStats, { averageDailySteps: 0 });

    recoveryData.push({
      patient: {
        name: patient.name,
        patientId: patient.patientId,
        surgeryType: patient.surgeryType
      },
      recoveryProgress: recoveryProgress.currentProgress,
      vitalStability: vitalStats.heartRate.trend === 'stable' && vitalStats.bloodPressure.trend === 'stable',
      riskLevel: recoveryProgress.currentProgress > 75 ? 'low' : recoveryProgress.currentProgress > 50 ? 'medium' : 'high'
    });
  }

  return {
    summary: {
      totalPatients: recoveryData.length,
      averageRecoveryRate: Math.round(recoveryData.reduce((sum, p) => sum + p.recoveryProgress, 0) / recoveryData.length),
      patientsOnTrack: recoveryData.filter(p => p.recoveryProgress > 50).length,
      highRiskPatients: recoveryData.filter(p => p.riskLevel === 'high').length
    },
    detailedData: includeRawData ? recoveryData : null,
    charts: includeCharts ? {
      recoveryDistribution: recoveryData.map(p => ({ name: p.patient.name, recovery: p.recoveryProgress })),
      riskLevels: {
        low: recoveryData.filter(p => p.riskLevel === 'low').length,
        medium: recoveryData.filter(p => p.riskLevel === 'medium').length,
        high: recoveryData.filter(p => p.riskLevel === 'high').length
      }
    } : null,
    generatedAt: new Date().toISOString()
  };
}

async function generateSystemPerformanceReport(startDate, endDate, includeCharts, includeRawData) {
  const performanceMetrics = await getPerformanceMetrics(startDate, endDate);
  const systemHealth = await getSystemHealthMetrics(startDate, endDate);

  return {
    summary: {
      overallHealth: systemHealth.healthScore,
      uptime: systemHealth.uptime,
      totalDataPoints: performanceMetrics.dataPointsProcessed,
      averageResponseTime: performanceMetrics.averageResponseTime,
      errorRate: performanceMetrics.errorRate
    },
    metrics: {
      performance: performanceMetrics,
      health: systemHealth
    },
    charts: includeCharts ? {
      uptimeTrend: [99.9, 99.8, 99.7, 99.8, 99.9, 99.8], // Mock weekly uptime
      responseTimes: [245, 250, 243, 248, 245, 247], // Mock daily response times
      throughputTrend: [1440, 1450, 1435, 1442, 1448, 1440] // Mock daily throughput
    } : null,
    generatedAt: new Date().toISOString()
  };
}

async function generateEmergencyResponseReport(startDate, endDate, includeCharts, includeRawData) {
  const criticalAlerts = await Alert.find({
    createdAt: { $gte: startDate, $lte: endDate },
    severity: 'critical'
  }).populate('userId', 'name patientId');

  const emergencyMetrics = {
    totalEmergencies: criticalAlerts.length,
    averageResponseTime: 4.2, // minutes - mock data
    successfulResolutions: Math.round(criticalAlerts.length * 0.95),
    escalatedCases: Math.round(criticalAlerts.length * 0.05)
  };

  return {
    summary: emergencyMetrics,
    incidents: includeRawData ? criticalAlerts.map(alert => ({
      id: alert._id,
      patient: alert.userId?.name || 'Unknown',
      type: alert.type,
      timestamp: alert.createdAt,
      responseTime: Math.round(Math.random() * 10 + 2), // Mock response time
      resolution: alert.status === 'resolved' ? 'Resolved' : 'Pending'
    })) : null,
    charts: includeCharts ? {
      responseTimeDistribution: [2, 3, 4, 5, 6, 8, 10], // Mock response time distribution
      incidentsByType: criticalAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {})
    } : null,
    generatedAt: new Date().toISOString()
  };
}

async function generateComplianceReport(startDate, endDate, includeCharts, includeRawData) {
  return {
    summary: {
      overallCompliance: 98.5, // Mock compliance percentage
      dataSecurityScore: 95.2,
      accessControlScore: 99.1,
      auditTrailCompleteness: 100
    },
    findings: [
      { type: 'Data Encryption', status: 'Compliant', score: 100 },
      { type: 'Access Logs', status: 'Compliant', score: 99.1 },
      { type: 'Data Retention', status: 'Minor Issues', score: 92.3 },
      { type: 'User Authentication', status: 'Compliant', score: 100 }
    ],
    recommendations: [
      'Review data retention policies for older patient records',
      'Update security protocols for third-party integrations',
      'Conduct quarterly security awareness training'
    ],
    generatedAt: new Date().toISOString()
  };
}

async function generateRevenueReport(startDate, endDate, includeCharts, includeRawData) {
  const totalPatients = await User.countDocuments({ role: 'patient' });
  
  return {
    summary: {
      totalRevenue: totalPatients * 150, // Mock: $150 per patient per month
      monthlyRecurring: totalPatients * 150,
      newSubscriptions: Math.round(totalPatients * 0.1),
      churnRate: 2.3 // Mock churn rate percentage
    },
    metrics: {
      revenuePerPatient: 150,
      lifetimeValue: 1800, // Mock LTV
      acquisitionCost: 75, // Mock CAC
      profitMargin: 65 // Mock profit margin percentage
    },
    charts: includeCharts ? {
      monthlyRevenue: [22500, 23250, 24000, 24750, 25500, totalPatients * 150],
      subscriptionGrowth: [150, 155, 160, 165, 170, totalPatients]
    } : null,
    generatedAt: new Date().toISOString()
  };
}

// Helper function to convert report data to CSV
function convertReportToCSV(report) {
  let csvContent = '';
  
  // Add report header
  csvContent += `Report Type,${report.type}\n`;
  csvContent += `Generated At,${report.generatedAt}\n`;
  csvContent += `Generated By,${report.generatedBy?.name || 'System'}\n`;
  csvContent += `Period Start,${report.period?.startDate || 'N/A'}\n`;
  csvContent += `Period End,${report.period?.endDate || 'N/A'}\n\n`;
  
  if (report.adminReportData) {
    // Admin report data
    const data = report.adminReportData;
    
    if (data.summary) {
      csvContent += 'Summary\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        csvContent += `${key},${value}\n`;
      });
      csvContent += '\n';
    }
    
    if (data.metrics) {
      csvContent += 'Metrics\n';
      const flattenObject = (obj, prefix = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flattenObject(value, newKey);
          } else {
            csvContent += `${newKey},${value}\n`;
          }
        });
      };
      flattenObject(data.metrics);
      csvContent += '\n';
    }
    
    if (data.detailedData && Array.isArray(data.detailedData)) {
      csvContent += 'Detailed Data\n';
      if (data.detailedData.length > 0) {
        const headers = Object.keys(data.detailedData[0]);
        csvContent += headers.join(',') + '\n';
        data.detailedData.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'object' ? JSON.stringify(value) : value;
          });
          csvContent += values.join(',') + '\n';
        });
      }
    }
  } else {
    // Regular patient report data
    if (report.vitalStatistics) {
      csvContent += 'Vital Statistics\n';
      csvContent += 'Metric,Average,Min,Max,Trend\n';
      csvContent += `Heart Rate,${report.vitalStatistics.heartRate?.average},${report.vitalStatistics.heartRate?.min},${report.vitalStatistics.heartRate?.max},${report.vitalStatistics.heartRate?.trend}\n`;
      csvContent += `Blood Pressure Systolic,${report.vitalStatistics.bloodPressure?.averageSystolic},${report.vitalStatistics.bloodPressure?.minSystolic},${report.vitalStatistics.bloodPressure?.maxSystolic},${report.vitalStatistics.bloodPressure?.trend}\n`;
      csvContent += `SpO2,${report.vitalStatistics.spO2?.average},${report.vitalStatistics.spO2?.min},${report.vitalStatistics.spO2?.max},${report.vitalStatistics.spO2?.trend}\n\n`;
    }
    
    if (report.recoveryProgress) {
      csvContent += 'Recovery Progress\n';
      csvContent += `Current Progress,${report.recoveryProgress.currentProgress}%\n`;
      csvContent += `Expected Progress,${report.recoveryProgress.expectedProgress}%\n`;
      csvContent += `Status,${report.recoveryProgress.status}\n\n`;
    }
  }
  
  return csvContent;
}

module.exports = router;