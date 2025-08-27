const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const Report = require('../models/Report');
const DietPlan = require('../models/DietPlan');
const ExercisePlan = require('../models/ExercisePlan');
const Prescription = require('../models/Prescription');
const { authenticate, canAccessPatientData, requireDoctorOrSuperAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/patient/dashboard/:patientId
 * @desc    Get patient dashboard data
 * @access  Private (Patient, Doctor, Admin)
 */
router.get('/dashboard/:patientId', authenticate, canAccessPatientData, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get patient details
    const patient = await User.findById(patientId)
      .select('-password')
      .populate('assignedDoctor', 'name email');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get latest sensor data (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sensorData = await SensorData.find({
      userId: patientId,
      recordedAt: { $gte: twentyFourHoursAgo }
    }).sort({ recordedAt: -1 }).limit(100);

    // Get latest vital signs
    const latestVitals = sensorData[0] || null;

    // Get active alerts
    const activeAlerts = await Alert.find({
      userId: patientId,
      status: { $in: ['pending', 'acknowledged'] }
    }).sort({ createdAt: -1 }).limit(10);

    // Get diet and exercise plans
    const dietPlan = await DietPlan.findOne({ userId: patientId, active: true });
    const exercisePlan = await ExercisePlan.findOne({ userId: patientId, active: true });

    // Calculate weekly progress
    const weeklyProgress = calculateWeeklyProgress(sensorData, exercisePlan);

    // Get next medication reminder
    const nextMedication = getNextMedication(patient.medications);

    // Get expected recovery time and progress
    const recoveryStatus = {
      expectedDays: patient.expectedRecoveryTime || 90,
      elapsedDays: Math.floor((Date.now() - new Date(patient.surgeryDate)) / (1000 * 60 * 60 * 24)),
      progressPercentage: patient.actualRecoveryProgress || 0
    };

    res.json({
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        surgeryType: patient.surgeryType,
        surgeryDate: patient.surgeryDate,
        bandStatus: patient.isBandActive
      },
      vitals: {
        current: latestVitals ? {
          heartRate: latestVitals.heartRate.value,
          bloodPressure: `${latestVitals.bloodPressure.systolic}/${latestVitals.bloodPressure.diastolic}`,
          spO2: latestVitals.spO2.value,
          temperature: latestVitals.temperature.value,
          lastUpdated: latestVitals.recordedAt
        } : null,
        history: sensorData
      },
      alerts: activeAlerts,
      weeklyProgress,
      nextMedication,
      recoveryStatus,
      dietPlan: dietPlan ? {
        meals: dietPlan.meals,
        dailyTargets: dietPlan.dailyTargets,
        recommendations: dietPlan.basedOnVitals
      } : null,
      exercisePlan: exercisePlan ? {
        todayExercises: getTodayExercises(exercisePlan),
        weeklyTargets: exercisePlan.weeklyTargets,
        achievements: exercisePlan.achievements
      } : null,
      motivationalQuote: getMotivationalQuote()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/patient/list
 * @desc    Get all patients (for admin/doctor)
 * @access  Private (Doctor, Admin)
 */
router.get('/list', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    let query = { role: 'patient' };
    
    // If doctor, only show assigned patients
    if (req.user.role === 'doctor') {
      query.assignedDoctor = req.user._id;
    }

    const patients = await User.find(query)
      .select('-password')
      .populate('assignedDoctor', 'name email')
      .sort({ createdAt: -1 });

    // Get latest vitals for each patient
    const patientsWithVitals = await Promise.all(
      patients.map(async (patient) => {
        const latestSensorData = await SensorData.findOne({ userId: patient._id })
          .sort({ recordedAt: -1 });
        
        const activeAlerts = await Alert.countDocuments({
          userId: patient._id,
          status: 'pending'
        });

        return {
          ...patient.toObject(),
          latestVitals: latestSensorData,
          activeAlertsCount: activeAlerts
        };
      })
    );

    res.json({ patients: patientsWithVitals });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/patient/:patientId/medications
 * @desc    Update patient medications
 * @access  Private (Doctor, Admin)
 */
router.put('/:patientId/medications', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medications } = req.body;

    const patient = await User.findByIdAndUpdate(
      patientId,
      { medications, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    res.json({ 
      message: 'Medications updated successfully',
      patient 
    });
  } catch (error) {
    console.error('Update medications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/patient/health-monitoring
 * @desc    Get patient's health monitoring data with charts
 * @access  Private (Patient only)
 */
router.get('/health-monitoring', authenticate, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;
    const { range = '24h' } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient ID is required' 
      });
    }
    
    // Calculate time range
    let startDate;
    switch (range) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get sensor data for the time range
    const sensorData = await SensorData.find({
      userId: patientId,
      recordedAt: { $gte: startDate }
    }).sort({ recordedAt: 1 });

    // Get patient alerts for the time range
    const alerts = await Alert.find({
      userId: patientId,
      createdAt: { $gte: startDate },
      severity: { $in: ['medium', 'high', 'critical'] }
    }).sort({ createdAt: -1 });

    // Process vitals data for charts
    const vitals = sensorData.map(data => ({
      timestamp: data.recordedAt,
      heartRate: data.heartRate?.value,
      systolic: data.bloodPressure?.systolic,
      diastolic: data.bloodPressure?.diastolic,
      temperature: data.temperature?.value,
      spO2: data.spO2?.value
    }));

    // Calculate averages
    const calculateAverage = (values) => {
      const validValues = values.filter(v => v != null && !isNaN(v));
      return validValues.length > 0 
        ? Math.round(validValues.reduce((sum, v) => sum + v, 0) / validValues.length * 10) / 10
        : 0;
    };

    const averages = {
      heartRate: calculateAverage(vitals.map(v => v.heartRate)),
      bloodPressure: {
        systolic: calculateAverage(vitals.map(v => v.systolic)),
        diastolic: calculateAverage(vitals.map(v => v.diastolic))
      },
      temperature: calculateAverage(vitals.map(v => v.temperature)),
      spO2: calculateAverage(vitals.map(v => v.spO2))
    };

    // Calculate trends (comparing first half vs second half of data)
    const calculateTrend = (values) => {
      const validValues = values.filter(v => v != null && !isNaN(v));
      if (validValues.length < 4) return 'stable';
      
      const mid = Math.floor(validValues.length / 2);
      const firstHalf = validValues.slice(0, mid);
      const secondHalf = validValues.slice(mid);
      
      const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
      
      const difference = secondAvg - firstAvg;
      const threshold = firstAvg * 0.05; // 5% threshold
      
      if (Math.abs(difference) < threshold) return 'stable';
      return difference > 0 ? 'up' : 'down';
    };

    const trends = {
      heartRate: calculateTrend(vitals.map(v => v.heartRate)),
      bloodPressure: calculateTrend(vitals.map(v => v.systolic)),
      temperature: calculateTrend(vitals.map(v => v.temperature)),
      spO2: calculateTrend(vitals.map(v => v.spO2))
    };

    // Format alerts
    const formattedAlerts = alerts.map(alert => ({
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.createdAt
    }));

    res.json({
      success: true,
      data: {
        vitals,
        averages,
        trends,
        alerts: formattedAlerts
      }
    });
  } catch (error) {
    console.error('Health monitoring error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patient/emergency
 * @desc    Send emergency SOS alert
 * @access  Private (Patient only)
 */
router.post('/emergency', authenticate, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.body.patientId;
    const { message = 'Emergency SOS activated', location } = req.body;

    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient ID is required' 
      });
    }

    // Create emergency alert
    const emergencyAlert = new Alert({
      userId: patientId,
      type: 'Emergency SOS',
      message,
      severity: 'critical',
      status: 'pending',
      metadata: {
        location,
        timestamp: new Date(),
        source: 'manual_sos'
      }
    });

    await emergencyAlert.save();

    // Here you would typically:
    // 1. Notify assigned doctors immediately
    // 2. Send SMS/email to emergency contacts
    // 3. Trigger emergency response protocols
    
    res.json({
      success: true,
      message: 'Emergency alert sent successfully',
      data: {
        alertId: emergencyAlert._id,
        timestamp: emergencyAlert.createdAt
      }
    });
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/patient/medications
 * @desc    Get patient's medication schedule and adherence data
 * @access  Private (Patient/Doctor/Admin)
 */
router.get('/medications', authenticate, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient ID is required' 
      });
    }

    // Get active prescriptions for the patient
    const prescriptions = await Prescription.find({
      patientId,
      status: 'active',
      validUntil: { $gte: new Date() }
    }).populate('doctorId', 'name email');

    // Extract medications from prescriptions
    const medications = prescriptions.flatMap(prescription => 
      prescription.medications.map(med => ({
        _id: `${prescription._id}_${med.name}`,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        instructions: med.instructions,
        prescribedBy: prescription.doctorId.name,
        startDate: prescription.createdAt,
        endDate: prescription.validUntil,
        totalDoses: calculateTotalDoses(med.frequency, prescription.createdAt, prescription.validUntil),
        takenDoses: Math.floor(Math.random() * 20), // Mock data - should be from medication logs
        status: 'active'
      }))
    );

    // Generate today's schedule (mock implementation)
    const todaySchedule = generateDailySchedule(medications, date);

    // Generate weekly schedule
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weeklySchedule = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weeklySchedule.push(...generateDailySchedule(medications, day.toISOString().split('T')[0]));
    }

    // Calculate adherence statistics (mock data)
    const adherenceStats = {
      overallRate: 85,
      thisWeek: 92,
      thisMonth: 87,
      streakDays: 5
    };

    // Generate upcoming reminders
    const upcomingReminders = todaySchedule
      .filter(schedule => schedule.status === 'pending')
      .map(schedule => ({
        medication: schedule.medication.name,
        time: schedule.scheduledTime,
        timeUntil: calculateTimeUntil(schedule.scheduledTime)
      }))
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        medications,
        todaySchedule,
        weeklySchedule,
        adherenceStats,
        upcomingReminders
      }
    });
  } catch (error) {
    console.error('Medication schedule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patient/medication-log/:scheduleId
 * @desc    Log medication intake
 * @access  Private (Patient only)
 */
router.post('/medication-log/:scheduleId', authenticate, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status, actualTime, notes, sideEffects, loggedAt } = req.body;
    
    // In a real implementation, you would:
    // 1. Find the medication schedule record
    // 2. Create a medication log entry
    // 3. Update adherence statistics
    // 4. Trigger notifications if needed

    // For now, return success
    res.json({
      success: true,
      message: 'Medication logged successfully',
      data: {
        scheduleId,
        status,
        loggedAt: loggedAt || new Date()
      }
    });
  } catch (error) {
    console.error('Medication log error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/patient/monthly-report
 * @desc    Get comprehensive monthly health report
 * @access  Private (Patient/Doctor/Admin)
 */
router.get('/monthly-report', authenticate, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;
    const { month = new Date().getMonth(), year = new Date().getFullYear() } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient ID is required' 
      });
    }

    // Get patient info
    const patient = await User.findById(patientId)
      .populate('assignedDoctors', 'name email')
      .select('name patientId surgeryType surgeryDate');

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Patient not found' 
      });
    }

    // Calculate report period
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    // Get sensor data for the month
    const sensorData = await SensorData.find({
      userId: patientId,
      recordedAt: { $gte: startDate, $lte: endDate }
    }).sort({ recordedAt: 1 });

    // Get alerts for the month
    const alerts = await Alert.find({
      userId: patientId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    // Get prescriptions for medication adherence
    const prescriptions = await Prescription.find({
      patientId,
      createdAt: { $lte: endDate },
      validUntil: { $gte: startDate }
    }).populate('doctorId', 'name');

    // Process vitals analysis
    const vitalsAnalysis = processVitalsAnalysis(sensorData);
    
    // Process medication adherence
    const medicationAdherence = processMedicationAdherence(prescriptions);
    
    // Calculate recovery progress
    const recoveryProgress = calculateRecoveryProgress(patient, sensorData);
    
    // Format alerts
    const formattedAlerts = alerts.map(alert => ({
      date: alert.createdAt.toISOString().split('T')[0],
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      resolved: alert.status === 'resolved'
    }));

    // Generate recommendations
    const recommendations = generateRecommendations(vitalsAnalysis, medicationAdherence, recoveryProgress);
    
    // Generate summary
    const summary = generateSummary(vitalsAnalysis, medicationAdherence, recoveryProgress, formattedAlerts);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const report = {
      reportId: `RPT-${patientId}-${year}-${String(month + 1).padStart(2, '0')}`,
      patientInfo: {
        name: patient.name,
        patientId: patient.patientId,
        surgeryType: patient.surgeryType,
        surgeryDate: patient.surgeryDate,
        doctorName: patient.assignedDoctors[0]?.name || 'Not assigned'
      },
      reportPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        month: monthNames[month],
        year: parseInt(year)
      },
      vitalsAnalysis,
      medicationAdherence,
      recoveryProgress,
      alerts: formattedAlerts,
      recommendations,
      summary
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patient/generate-pdf-report
 * @desc    Generate PDF version of monthly report
 * @access  Private (Patient/Doctor/Admin)
 */
router.post('/generate-pdf-report', authenticate, async (req, res) => {
  try {
    const { month, year, format = 'pdf' } = req.body;
    
    // In a real implementation, you would:
    // 1. Generate the monthly report data
    // 2. Use a PDF library (like puppeteer, jsPDF, or PDFKit) to create PDF
    // 3. Save to cloud storage or temp folder
    // 4. Return download URL
    
    // Mock implementation
    const downloadUrl = `/api/patient/download-report?month=${month}&year=${year}&format=${format}&token=${Date.now()}`;
    
    res.json({
      success: true,
      data: {
        downloadUrl,
        filename: `health-report-${month + 1}-${year}.pdf`,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patient/email-report
 * @desc    Email monthly report to patient and doctor
 * @access  Private (Patient/Doctor/Admin)
 */
router.post('/email-report', authenticate, async (req, res) => {
  try {
    const { month, year, reportId } = req.body;
    
    // In a real implementation, you would:
    // 1. Generate the PDF report
    // 2. Send email with attachment to patient and assigned doctors
    // 3. Log the email activity
    
    res.json({
      success: true,
      message: 'Report emailed successfully',
      data: {
        reportId,
        emailedAt: new Date(),
        recipients: ['patient@email.com', 'doctor@email.com']
      }
    });
  } catch (error) {
    console.error('Email report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to process vitals analysis
 */
function processVitalsAnalysis(sensorData) {
  if (sensorData.length === 0) {
    return {
      averages: { heartRate: 0, bloodPressure: { systolic: 0, diastolic: 0 }, temperature: 0, spO2: 0 },
      trends: { heartRate: 'stable', bloodPressure: 'stable', temperature: 'stable', spO2: 'stable' },
      chartData: []
    };
  }

  const calculateAverage = (values) => {
    const validValues = values.filter(v => v != null && !isNaN(v));
    return validValues.length > 0 
      ? Math.round(validValues.reduce((sum, v) => sum + v, 0) / validValues.length * 10) / 10
      : 0;
  };

  const heartRates = sensorData.map(d => d.heartRate?.value).filter(Boolean);
  const systolicBP = sensorData.map(d => d.bloodPressure?.systolic).filter(Boolean);
  const diastolicBP = sensorData.map(d => d.bloodPressure?.diastolic).filter(Boolean);
  const temperatures = sensorData.map(d => d.temperature?.value).filter(Boolean);
  const spO2Values = sensorData.map(d => d.spO2?.value).filter(Boolean);

  const averages = {
    heartRate: calculateAverage(heartRates),
    bloodPressure: {
      systolic: calculateAverage(systolicBP),
      diastolic: calculateAverage(diastolicBP)
    },
    temperature: calculateAverage(temperatures),
    spO2: calculateAverage(spO2Values)
  };

  // Calculate trends (simplified)
  const calculateTrend = (values) => {
    if (values.length < 7) return 'stable';
    const firstWeek = values.slice(0, 7);
    const lastWeek = values.slice(-7);
    const firstAvg = calculateAverage(firstWeek);
    const lastAvg = calculateAverage(lastWeek);
    const change = ((lastAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'improving' : 'concerning';
  };

  const trends = {
    heartRate: calculateTrend(heartRates),
    bloodPressure: calculateTrend(systolicBP),
    temperature: calculateTrend(temperatures),
    spO2: calculateTrend(spO2Values)
  };

  // Generate chart data (weekly averages)
  const chartData = [];
  for (let i = 0; i < sensorData.length; i += 7) {
    const weekData = sensorData.slice(i, i + 7);
    if (weekData.length > 0) {
      chartData.push({
        date: weekData[0].recordedAt.toISOString().split('T')[0],
        heartRate: calculateAverage(weekData.map(d => d.heartRate?.value).filter(Boolean)),
        systolic: calculateAverage(weekData.map(d => d.bloodPressure?.systolic).filter(Boolean)),
        diastolic: calculateAverage(weekData.map(d => d.bloodPressure?.diastolic).filter(Boolean)),
        temperature: calculateAverage(weekData.map(d => d.temperature?.value).filter(Boolean)),
        spO2: calculateAverage(weekData.map(d => d.spO2?.value).filter(Boolean))
      });
    }
  }

  return { averages, trends, chartData };
}

/**
 * Helper function to process medication adherence
 */
function processMedicationAdherence(prescriptions) {
  if (prescriptions.length === 0) {
    return {
      overallRate: 0,
      medications: [],
      sideEffectsReported: []
    };
  }

  const medications = prescriptions.flatMap(prescription => 
    prescription.medications.map(med => ({
      name: med.name,
      adherenceRate: Math.floor(Math.random() * 30) + 70, // Mock: 70-100%
      missedDoses: Math.floor(Math.random() * 5),
      totalDoses: 30 // Mock
    }))
  );

  const overallRate = Math.round(
    medications.reduce((sum, med) => sum + med.adherenceRate, 0) / medications.length
  );

  return {
    overallRate,
    medications,
    sideEffectsReported: ['Mild nausea', 'Drowsiness'] // Mock data
  };
}

/**
 * Helper function to calculate recovery progress
 */
function calculateRecoveryProgress(patient, sensorData) {
  const daysSinceSurgery = Math.floor(
    (Date.now() - new Date(patient.surgeryDate)) / (1000 * 60 * 60 * 24)
  );
  
  const currentProgress = Math.min((daysSinceSurgery / 90) * 100, 100); // Assuming 90-day recovery
  const expectedProgress = Math.min((daysSinceSurgery / 90) * 100, 100);

  const milestones = [
    { milestone: 'Initial wound healing', achieved: daysSinceSurgery > 7, achievedDate: daysSinceSurgery > 7 ? new Date(Date.now() - (daysSinceSurgery - 7) * 24 * 60 * 60 * 1000).toISOString() : null },
    { milestone: 'Pain reduction', achieved: daysSinceSurgery > 14, achievedDate: daysSinceSurgery > 14 ? new Date(Date.now() - (daysSinceSurgery - 14) * 24 * 60 * 60 * 1000).toISOString() : null },
    { milestone: 'Mobility improvement', achieved: daysSinceSurgery > 21, achievedDate: daysSinceSurgery > 21 ? new Date(Date.now() - (daysSinceSurgery - 21) * 24 * 60 * 60 * 1000).toISOString() : null },
    { milestone: 'Full recovery', achieved: daysSinceSurgery > 90, achievedDate: daysSinceSurgery > 90 ? new Date(Date.now() - (daysSinceSurgery - 90) * 24 * 60 * 60 * 1000).toISOString() : null }
  ];

  return {
    currentProgress: Math.round(currentProgress),
    expectedProgress: Math.round(expectedProgress),
    milestones
  };
}

/**
 * Helper function to generate recommendations
 */
function generateRecommendations(vitalsAnalysis, medicationAdherence, recoveryProgress) {
  const recommendations = [];

  if (medicationAdherence.overallRate < 80) {
    recommendations.push({
      category: 'Medication',
      recommendation: 'Consider setting up medication reminders to improve adherence rates.',
      priority: 'high'
    });
  }

  if (vitalsAnalysis.trends.heartRate === 'concerning') {
    recommendations.push({
      category: 'Vitals',
      recommendation: 'Monitor heart rate trends more closely. Consider consulting with your doctor.',
      priority: 'medium'
    });
  }

  if (recoveryProgress.currentProgress < recoveryProgress.expectedProgress - 10) {
    recommendations.push({
      category: 'Recovery',
      recommendation: 'Recovery may be slower than expected. Follow up with your healthcare team.',
      priority: 'medium'
    });
  }

  recommendations.push({
    category: 'General',
    recommendation: 'Continue following your prescribed treatment plan and attend all follow-up appointments.',
    priority: 'low'
  });

  return recommendations;
}

/**
 * Helper function to generate summary
 */
function generateSummary(vitalsAnalysis, medicationAdherence, recoveryProgress, alerts) {
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
  
  let overallStatus = 'good';
  if (criticalAlerts > 0 || medicationAdherence.overallRate < 70) {
    overallStatus = 'concerning';
  } else if (medicationAdherence.overallRate >= 90 && recoveryProgress.currentProgress >= recoveryProgress.expectedProgress) {
    overallStatus = 'excellent';
  } else if (medicationAdherence.overallRate < 80) {
    overallStatus = 'fair';
  }

  const keyInsights = [
    `Overall medication adherence rate: ${medicationAdherence.overallRate}%`,
    `Recovery progress: ${recoveryProgress.currentProgress}% (Expected: ${recoveryProgress.expectedProgress}%)`,
    `Total alerts this month: ${alerts.length} (Critical: ${criticalAlerts})`,
    `Vital signs trends: ${Object.values(vitalsAnalysis.trends).filter(t => t === 'improving').length} improving parameters`
  ];

  const nextSteps = [
    'Continue taking medications as prescribed',
    'Attend scheduled follow-up appointments',
    'Monitor vital signs regularly',
    'Report any concerning symptoms immediately'
  ];

  return {
    overallStatus,
    keyInsights,
    nextSteps
  };
}

/**
 * @route   GET /api/patient/diet-plan
 * @desc    Get patient's diet plan and nutrition tracking
 * @access  Private (Patient/Doctor/Admin)
 */
router.get('/diet-plan', authenticate, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    if (!patientId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient ID is required' 
      });
    }

    // Mock diet plan data - in production, this would come from a nutrition database
    const dietPlan = {
      id: `DIET-${patientId}-${date}`,
      patientId,
      planName: 'Post-Surgery Recovery Diet',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nutritionTargets: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67,
        fiber: 25,
        water: 2.5,
        sodium: 2300
      },
      todayMeals: [
        {
          id: 'breakfast-1',
          name: 'Protein-Rich Breakfast Bowl',
          type: 'breakfast',
          time: '08:00',
          calories: 450,
          protein: 25,
          carbs: 45,
          fat: 18,
          fiber: 8,
          ingredients: ['Oatmeal', 'Greek yogurt', 'Berries', 'Almonds', 'Honey'],
          instructions: 'Mix oatmeal with Greek yogurt, top with berries and almonds, drizzle with honey',
          completed: Math.random() > 0.5,
          rating: Math.floor(Math.random() * 5) + 1
        },
        {
          id: 'lunch-1',
          name: 'Grilled Chicken Salad',
          type: 'lunch',
          time: '12:30',
          calories: 520,
          protein: 40,
          carbs: 35,
          fat: 22,
          fiber: 12,
          ingredients: ['Grilled chicken', 'Mixed greens', 'Quinoa', 'Avocado', 'Cherry tomatoes', 'Olive oil dressing'],
          instructions: 'Combine all ingredients in a bowl, dress with olive oil vinaigrette',
          completed: Math.random() > 0.5,
          rating: Math.floor(Math.random() * 5) + 1
        },
        {
          id: 'snack-1',
          name: 'Protein Smoothie',
          type: 'snack',
          time: '15:30',
          calories: 280,
          protein: 20,
          carbs: 30,
          fat: 8,
          fiber: 5,
          ingredients: ['Protein powder', 'Banana', 'Spinach', 'Almond milk', 'Chia seeds'],
          instructions: 'Blend all ingredients until smooth',
          completed: Math.random() > 0.5
        },
        {
          id: 'dinner-1',
          name: 'Baked Salmon with Vegetables',
          type: 'dinner',
          time: '19:00',
          calories: 480,
          protein: 35,
          carbs: 40,
          fat: 20,
          fiber: 10,
          ingredients: ['Salmon fillet', 'Sweet potato', 'Broccoli', 'Asparagus', 'Olive oil', 'Lemon'],
          instructions: 'Bake salmon at 400°F for 15 minutes, serve with roasted vegetables',
          completed: false
        }
      ],
      weeklyProgress: [
        { day: 'Mon', caloriesConsumed: 1800, caloriesTarget: 2000, proteinConsumed: 140, proteinTarget: 150 },
        { day: 'Tue', caloriesConsumed: 1950, caloriesTarget: 2000, proteinConsumed: 145, proteinTarget: 150 },
        { day: 'Wed', caloriesConsumed: 2100, caloriesTarget: 2000, proteinConsumed: 155, proteinTarget: 150 },
        { day: 'Thu', caloriesConsumed: 1880, caloriesTarget: 2000, proteinConsumed: 138, proteinTarget: 150 },
        { day: 'Fri', caloriesConsumed: 2050, caloriesTarget: 2000, proteinConsumed: 152, proteinTarget: 150 },
        { day: 'Sat', caloriesConsumed: 1920, caloriesTarget: 2000, proteinConsumed: 142, proteinTarget: 150 },
        { day: 'Today', caloriesConsumed: 0, caloriesTarget: 2000, proteinConsumed: 0, proteinTarget: 150 }
      ],
      recommendations: [
        'Eat protein at every meal to support healing',
        'Include anti-inflammatory foods like berries and fatty fish',
        'Stay hydrated with at least 8 glasses of water daily',
        'Eat smaller, frequent meals to aid digestion',
        'Include fiber-rich foods to prevent constipation'
      ],
      restrictions: [
        'Limit processed foods',
        'Reduce sodium intake',
        'Avoid alcohol during recovery'
      ],
      supplements: [
        { name: 'Vitamin D3', dosage: '2000 IU', timing: 'With breakfast' },
        { name: 'Omega-3', dosage: '1000mg', timing: 'With dinner' },
        { name: 'Probiotics', dosage: '1 capsule', timing: 'Before bed' }
      ]
    };

    res.json({
      success: true,
      data: dietPlan
    });
  } catch (error) {
    console.error('Diet plan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/patient/water-intake
 * @desc    Get patient's water intake tracking
 * @access  Private (Patient/Doctor/Admin)
 */
router.get('/water-intake', authenticate, async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    // Mock water intake data
    const waterIntake = {
      target: 2.5, // liters
      consumed: Math.round((Math.random() * 2 + 0.5) * 10) / 10,
      logs: [
        { time: '08:00', amount: 250 },
        { time: '10:30', amount: 500 },
        { time: '13:15', amount: 300 },
        { time: '16:00', amount: 250 },
        { time: '18:30', amount: 200 }
      ]
    };

    res.json({
      success: true,
      data: waterIntake
    });
  } catch (error) {
    console.error('Water intake error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patient/meal-log/:mealId
 * @desc    Log meal completion and rating
 * @access  Private (Patient only)
 */
router.post('/meal-log/:mealId', authenticate, async (req, res) => {
  try {
    const { mealId } = req.params;
    const { completed, rating, notes, loggedAt } = req.body;
    
    // In production, update meal log in database
    res.json({
      success: true,
      message: 'Meal logged successfully',
      data: {
        mealId,
        completed,
        rating,
        notes,
        loggedAt: loggedAt || new Date()
      }
    });
  } catch (error) {
    console.error('Meal log error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/patient/water-log
 * @desc    Log water intake
 * @access  Private (Patient only)
 */
router.post('/water-log', authenticate, async (req, res) => {
  try {
    const { amount, loggedAt } = req.body;
    
    // In production, update water intake log in database
    res.json({
      success: true,
      message: 'Water intake logged successfully',
      data: {
        amount,
        loggedAt: loggedAt || new Date()
      }
    });
  } catch (error) {
    console.error('Water log error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to calculate total doses based on frequency
 */
function calculateTotalDoses(frequency, startDate, endDate) {
  const frequencyMap = {
    'Once daily': 1,
    'Twice daily': 2,
    'Three times daily': 3,
    'Four times daily': 4,
    'Every 8 hours': 3,
    'Every 6 hours': 4,
    'Every 12 hours': 2,
    'As needed': 1
  };

  const dailyDoses = frequencyMap[frequency] || 1;
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  return dailyDoses * daysDiff;
}

/**
 * Helper function to generate daily medication schedule
 */
function generateDailySchedule(medications, date) {
  const schedule = [];
  
  medications.forEach(medication => {
    const times = getScheduleTimes(medication.frequency);
    times.forEach(time => {
      schedule.push({
        _id: `${medication._id}_${date}_${time}`,
        medicationId: medication._id,
        medication,
        scheduledTime: time,
        actualTime: Math.random() > 0.3 ? time : null, // Mock: 70% taken
        status: Math.random() > 0.3 ? 'taken' : 'pending',
        notes: '',
        sideEffects: []
      });
    });
  });

  return schedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

/**
 * Helper function to get schedule times based on frequency
 */
function getScheduleTimes(frequency) {
  const timeMap = {
    'Once daily': ['08:00'],
    'Twice daily': ['08:00', '20:00'],
    'Three times daily': ['08:00', '14:00', '20:00'],
    'Four times daily': ['08:00', '12:00', '16:00', '20:00'],
    'Every 8 hours': ['08:00', '16:00', '00:00'],
    'Every 6 hours': ['06:00', '12:00', '18:00', '00:00'],
    'Every 12 hours': ['08:00', '20:00'],
    'As needed': ['08:00']
  };

  return timeMap[frequency] || ['08:00'];
}

/**
 * Helper function to calculate time until scheduled dose
 */
function calculateTimeUntil(scheduledTime) {
  const now = new Date();
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  
  if (scheduled < now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  const diffMinutes = Math.floor((scheduled - now) / (1000 * 60));
  
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
  return `${Math.floor(diffMinutes / 1440)}d`;
}

// Helper functions
function calculateWeeklyProgress(sensorData, exercisePlan) {
  // Calculate based on various factors
  let progress = 0;
  let factors = [];

  // Vital signs stability (40%)
  if (sensorData.length > 0) {
    const stableVitals = sensorData.filter(data => {
      return data.heartRate.value >= 60 && data.heartRate.value <= 100 &&
             data.spO2.value >= 95;
    }).length;
    const vitalStability = (stableVitals / sensorData.length) * 40;
    progress += vitalStability;
    factors.push({ name: 'Vital Stability', value: vitalStability });
  }

  // Exercise completion (30%)
  if (exercisePlan) {
    const exerciseProgress = exercisePlan.calculateWeeklyProgress();
    const exerciseScore = (exerciseProgress.completionRate / 100) * 30;
    progress += exerciseScore;
    factors.push({ name: 'Exercise Completion', value: exerciseScore });
  }

  // Activity level (30%)
  // Mock data for now
  const activityScore = 20;
  progress += activityScore;
  factors.push({ name: 'Activity Level', value: activityScore });

  return {
    percentage: Math.min(Math.round(progress), 100),
    factors,
    trend: progress > 70 ? 'improving' : progress > 40 ? 'stable' : 'needs_attention'
  };
}

function getNextMedication(medications) {
  if (!medications || medications.length === 0) return null;

  const now = new Date();
  const todayMeds = medications.filter(med => med.active);
  
  // Simple mock - in production, calculate based on actual schedule
  if (todayMeds.length > 0) {
    return {
      name: todayMeds[0].name,
      dosage: todayMeds[0].dosage,
      timeUntil: '2 hours',
      time: '2:00 PM'
    };
  }
  
  return null;
}

function getTodayExercises(exercisePlan) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayPlan = exercisePlan.exercises.find(e => e.day === today);
  return todayPlan ? todayPlan.activities : [];
}

function getMotivationalQuote() {
  const quotes = [
    { text: "Every step forward is a step toward recovery.", author: "Unknown" },
    { text: "Your body is stronger than you think.", author: "Unknown" },
    { text: "Healing takes time, be patient with yourself.", author: "Unknown" },
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "You're stronger than you know.", author: "Unknown" }
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

module.exports = router;