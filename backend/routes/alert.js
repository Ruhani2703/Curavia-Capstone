const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');
const { authenticate, canAccessPatientData, requireDoctorOrSuperAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/alert
 * @desc    Get all alerts (for doctor/admin)
 * @access  Private (Doctor, Admin)
 */
router.get('/', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;

    let query = {};
    
    // If doctor, only show alerts for assigned patients or all patients if none assigned
    if (req.user.role === 'doctor') {
      // Find patients assigned to this doctor
      const doctor = await User.findById(req.user._id).populate('assignedPatients');
      
      if (doctor.assignedPatients && doctor.assignedPatients.length > 0) {
        const patientIds = doctor.assignedPatients.map(p => p._id);
        query.userId = { $in: patientIds };
      } else {
        // If no patients assigned, show alerts for all patients for demo purposes
        console.log('No assigned patients found for doctor, showing all patient alerts');
        const allPatients = await User.find({ role: 'patient' }).select('_id');
        const patientIds = allPatients.map(p => p._id);
        query.userId = { $in: patientIds };
      }
    }

    // Apply filters
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    if (severity) {
      if (severity.includes(',')) {
        query.severity = { $in: severity.split(',') };
      } else {
        query.severity = severity;
      }
    }

    const alerts = await Alert.find(query)
      .populate('userId', 'name patientId')
      .populate('acknowledgedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ 
      alerts,
      total: alerts.length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/alert/patient/:patientId
 * @desc    Get alerts for a patient
 * @access  Private
 */
router.get('/patient/:patientId', authenticate, canAccessPatientData, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, severity, limit = 50 } = req.query;

    let query = { userId: patientId };
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await Alert.find(query)
      .populate('acknowledgedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/alert/active
 * @desc    Get all active alerts (for admin/doctor)
 * @access  Private (Doctor, Admin)
 */
router.get('/active', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    let query = { status: { $in: ['pending', 'acknowledged'] } };

    // If doctor, only show alerts for assigned patients or all patients if none assigned
    if (req.user.role === 'doctor') {
      // Find patients assigned to this doctor
      const doctor = await User.findById(req.user._id).populate('assignedPatients');
      
      if (doctor.assignedPatients && doctor.assignedPatients.length > 0) {
        const patientIds = doctor.assignedPatients.map(p => p._id);
        query.userId = { $in: patientIds };
      } else {
        // If no patients assigned, show alerts for all patients for demo purposes
        console.log('No assigned patients found for doctor, showing all patient alerts');
        const allPatients = await User.find({ role: 'patient' }).select('_id');
        const patientIds = allPatients.map(p => p._id);
        query.userId = { $in: patientIds };
      }
    }

    const alerts = await Alert.find(query)
      .populate('userId', 'name patientId')
      .sort({ severity: -1, createdAt: -1 });

    // Group by severity
    const groupedAlerts = {
      critical: alerts.filter(a => a.severity === 'critical'),
      high: alerts.filter(a => a.severity === 'high'),
      medium: alerts.filter(a => a.severity === 'medium'),
      low: alerts.filter(a => a.severity === 'low')
    };

    res.json({ 
      alerts: groupedAlerts,
      total: alerts.length,
      summary: {
        critical: groupedAlerts.critical.length,
        high: groupedAlerts.high.length,
        medium: groupedAlerts.medium.length,
        low: groupedAlerts.low.length
      }
    });
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/alert/:alertId
 * @desc    Update alert status (acknowledge/resolve)
 * @access  Private (Doctor, Admin)
 */
router.put('/:alertId', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, acknowledgedAt, resolvedAt, notes } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Update alert fields
    if (status) alert.status = status;
    if (acknowledgedAt) {
      alert.acknowledgedAt = new Date(acknowledgedAt);
      alert.acknowledgedBy = req.user._id;
    }
    if (resolvedAt) {
      alert.resolvedAt = new Date(resolvedAt);
      alert.resolvedBy = req.user._id;
    }

    if (notes) {
      if (!alert.notes) alert.notes = [];
      alert.notes.push({
        text: notes,
        addedBy: req.user._id,
        addedAt: new Date()
      });
    }

    await alert.save();

    res.json({ 
      success: true,
      message: `Alert ${status || 'updated'}`,
      alert 
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/alert/:alertId/acknowledge
 * @desc    Acknowledge an alert
 * @access  Private
 */
router.put('/:alertId/acknowledge', authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Check access permissions
    if (req.user.role === 'patient' && alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update alert
    alert.status = 'acknowledged';
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
    
    if (notes) {
      alert.notes.push({
        text: notes,
        addedBy: req.user._id
      });
    }

    await alert.save();

    res.json({ 
      message: 'Alert acknowledged',
      alert 
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/alert/:alertId/resolve
 * @desc    Resolve an alert
 * @access  Private
 */
router.put('/:alertId/resolve', authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes, resolution } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Check access permissions
    if (req.user.role === 'patient' && alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update alert
    alert.status = 'resolved';
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    
    if (notes || resolution) {
      alert.notes.push({
        text: resolution || notes,
        addedBy: req.user._id
      });
    }

    await alert.save();

    res.json({ 
      message: 'Alert resolved',
      alert 
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/alert/:alertId/escalate
 * @desc    Escalate an alert
 * @access  Private (Doctor, Admin)
 */
router.put('/:alertId/escalate', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { escalateTo, reason } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Find user to escalate to
    const escalateUser = await User.findById(escalateTo);
    if (!escalateUser) {
      return res.status(404).json({ error: 'User to escalate to not found' });
    }

    // Update alert
    alert.status = 'escalated';
    alert.escalatedTo.push({
      userId: escalateTo,
      role: escalateUser.role,
      escalatedAt: new Date()
    });

    if (reason) {
      alert.notes.push({
        text: `Escalated: ${reason}`,
        addedBy: req.user._id
      });
    }

    await alert.save();

    // TODO: Send notification to escalated user

    res.json({ 
      message: 'Alert escalated successfully',
      alert 
    });
  } catch (error) {
    console.error('Escalate alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/alert/create
 * @desc    Create a manual alert
 * @access  Private (Doctor, Admin)
 */
router.post('/create', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { 
      patientId, 
      type, 
      severity, 
      title, 
      message, 
      details 
    } = req.body;

    // Validate patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create alert
    const alert = new Alert({
      userId: patientId,
      type: type || 'system',
      severity: severity || 'medium',
      title,
      message,
      details,
      createdBy: req.user._id
    });

    await alert.save();

    res.status(201).json({ 
      message: 'Alert created successfully',
      alert 
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/alert/emergency
 * @desc    Get emergency response data
 * @access  Private (Admin/Doctor)
 */
router.get('/emergency', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    // Get active emergencies (critical alerts)
    const activeEmergencies = await Alert.find({
      severity: 'critical',
      status: { $in: ['pending', 'acknowledged', 'escalated'] }
    })
    .populate('userId', 'name patientId age phone address')
    .sort({ createdAt: -1 });

    // Get recent resolved emergencies
    const recentEmergencies = await Alert.find({
      severity: { $in: ['critical', 'high'] },
      status: 'resolved',
      resolvedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .populate('userId', 'name patientId')
    .populate('resolvedBy', 'name role')
    .sort({ resolvedAt: -1 })
    .limit(10);

    // Mock hospital contacts and response teams (could be stored in database)
    const hospitalContacts = [
      { 
        id: 'HOSP001',
        name: 'Springfield General Hospital', 
        phone: '+1-555-HOSP-001', 
        distance: '2.3 miles', 
        available: true,
        specialties: ['Emergency', 'Cardiac', 'Trauma']
      },
      { 
        id: 'HOSP002',
        name: 'Memorial Medical Center', 
        phone: '+1-555-HOSP-002', 
        distance: '4.1 miles', 
        available: true,
        specialties: ['Emergency', 'Neurology', 'Surgery']
      },
      { 
        id: 'HOSP003',
        name: 'St. John\'s Emergency', 
        phone: '+1-555-HOSP-003', 
        distance: '6.8 miles', 
        available: false,
        specialties: ['Emergency', 'Pediatrics']
      }
    ];

    const responseTeams = [
      { id: 'EMS-12', name: 'EMS Unit 12', status: 'active', location: 'En route', type: 'ambulance' },
      { id: 'AMB-7', name: 'Ambulance 7', status: 'active', location: 'En route', type: 'ambulance' },
      { id: 'EMS-5', name: 'EMS Unit 5', status: 'available', location: 'Station 3', type: 'ems' },
      { id: 'AMB-2', name: 'Ambulance 2', status: 'maintenance', location: 'Station 1', type: 'ambulance' }
    ];

    // Format active emergencies with additional emergency data
    const formattedActiveEmergencies = activeEmergencies.map(alert => {
      const timeSinceCreated = Math.floor((new Date() - alert.createdAt) / 60000); // minutes
      return {
        id: alert._id,
        patient: {
          name: alert.userId?.name || 'Unknown',
          id: alert.userId?.patientId || alert.userId?._id,
          age: alert.userId?.age,
          phone: alert.userId?.phone
        },
        type: alert.title || 'Emergency Alert',
        severity: alert.severity,
        location: alert.userId?.address || 'Location unavailable',
        timeStarted: timeSinceCreated < 60 ? `${timeSinceCreated} minutes ago` : `${Math.floor(timeSinceCreated/60)} hours ago`,
        status: alert.status,
        vitals: alert.details?.vitals || {},
        assignedTeam: null, // TODO: Add team assignment logic
        estimatedArrival: null
      };
    });

    // Format recent emergencies
    const formattedRecentEmergencies = recentEmergencies.map(alert => {
      const duration = alert.resolvedAt ? 
        Math.floor((alert.resolvedAt - alert.createdAt) / 60000) : 0;
      const timeResolved = alert.resolvedAt ? 
        Math.floor((new Date() - alert.resolvedAt) / 60000) : 0;
      
      return {
        id: alert._id,
        patient: {
          name: alert.userId?.name || 'Unknown',
          id: alert.userId?.patientId || alert.userId?._id
        },
        type: alert.title || 'Emergency Alert',
        severity: alert.severity,
        timeResolved: timeResolved < 60 ? `${timeResolved} minutes ago` : `${Math.floor(timeResolved/60)} hours ago`,
        duration: duration < 60 ? `${duration} minutes` : `${Math.floor(duration/60)} hours`,
        outcome: 'resolved',
        resolvedBy: alert.resolvedBy?.name
      };
    });

    res.json({
      activeEmergencies: formattedActiveEmergencies,
      recentEmergencies: formattedRecentEmergencies,
      hospitalContacts,
      responseTeams,
      summary: {
        activeCount: formattedActiveEmergencies.length,
        availableTeams: responseTeams.filter(t => t.status === 'available').length,
        availableHospitals: hospitalContacts.filter(h => h.available).length
      }
    });

  } catch (error) {
    console.error('Get emergency data error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/alert/statistics
 * @desc    Get alert statistics
 * @access  Private (Admin)
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // Get statistics
    const [
      totalAlerts,
      pendingAlerts,
      resolvedAlerts,
      criticalAlerts,
      averageResponseTime
    ] = await Promise.all([
      Alert.countDocuments(dateQuery),
      Alert.countDocuments({ ...dateQuery, status: 'pending' }),
      Alert.countDocuments({ ...dateQuery, status: 'resolved' }),
      Alert.countDocuments({ ...dateQuery, severity: 'critical' }),
      calculateAverageResponseTime(dateQuery)
    ]);

    // Get alerts by type
    const alertsByType = await Alert.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get alerts by hour (for last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const alertsByHour = await Alert.aggregate([
      { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
      { 
        $group: { 
          _id: { $hour: '$createdAt' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      statistics: {
        total: totalAlerts,
        pending: pendingAlerts,
        resolved: resolvedAlerts,
        critical: criticalAlerts,
        resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts * 100).toFixed(1) : 0,
        averageResponseTime: averageResponseTime || 0
      },
      alertsByType,
      alertsByHour
    });
  } catch (error) {
    console.error('Get alert statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function
async function calculateAverageResponseTime(query) {
  const resolvedAlerts = await Alert.find({
    ...query,
    status: 'resolved',
    resolvedAt: { $exists: true }
  });

  if (resolvedAlerts.length === 0) return 0;

  const totalTime = resolvedAlerts.reduce((sum, alert) => {
    const responseTime = (alert.resolvedAt - alert.createdAt) / 1000 / 60; // in minutes
    return sum + responseTime;
  }, 0);

  return Math.round(totalTime / resolvedAlerts.length);
}

module.exports = router;