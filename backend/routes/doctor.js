const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const Prescription = require('../models/Prescription');
const { authenticate, requireDoctorOrSuperAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/doctor/dashboard
 * @desc    Get doctor dashboard data
 * @access  Private (Doctor/Super Admin only)
 */
router.get('/dashboard', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Get assigned patients
    const assignedPatients = await User.find({
      role: 'patient',
      assignedDoctors: doctorId
    }).select('name email patientId surgeryType surgeryDate actualRecoveryProgress isBandActive');

    // Get recent alerts for doctor's patients
    const patientIds = assignedPatients.map(p => p._id);
    const recentAlerts = await Alert.find({
      userId: { $in: patientIds },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate('userId', 'name patientId').limit(10).sort({ createdAt: -1 });

    // Calculate statistics
    const totalPatients = assignedPatients.length;
    const criticalPatients = assignedPatients.filter(p => p.actualRecoveryProgress < 30).length;
    const activeBands = assignedPatients.filter(p => p.isBandActive).length;
    const pendingAlerts = await Alert.countDocuments({
      userId: { $in: patientIds },
      status: 'pending'
    });

    // Get patients by recovery status
    const patientsByStatus = {
      critical: assignedPatients.filter(p => p.actualRecoveryProgress < 30),
      stable: assignedPatients.filter(p => p.actualRecoveryProgress >= 30 && p.actualRecoveryProgress < 70),
      recovering: assignedPatients.filter(p => p.actualRecoveryProgress >= 70)
    };

    res.json({
      success: true,
      data: {
        statistics: {
          totalPatients,
          criticalPatients,
          activeBands,
          pendingAlerts
        },
        assignedPatients: assignedPatients.slice(0, 6), // Top 6 for dashboard
        recentAlerts,
        patientsByStatus: {
          critical: patientsByStatus.critical.length,
          stable: patientsByStatus.stable.length,
          recovering: patientsByStatus.recovering.length
        }
      }
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/doctor/patients
 * @desc    Get all assigned patients for doctor
 * @access  Private (Doctor/Super Admin only)
 */
router.get('/patients', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status, search, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Build query for assigned patients
    let query = {
      role: 'patient',
      assignedDoctors: doctorId
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ];
    }

    // Get patients with latest sensor data
    let patients = await User.find(query)
      .select('name email patientId surgeryType surgeryDate actualRecoveryProgress isBandActive age gender bloodGroup emergencyContact')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Filter by recovery status if specified
    if (status) {
      patients = patients.filter(patient => {
        const progress = patient.actualRecoveryProgress;
        switch (status) {
          case 'critical': return progress < 30;
          case 'stable': return progress >= 30 && progress < 70;
          case 'recovering': return progress >= 70;
          default: return true;
        }
      });
    }

    // Get latest vital signs for each patient
    const patientsWithVitals = await Promise.all(
      patients.map(async (patient) => {
        const latestSensorData = await SensorData.findOne({
          userId: patient._id
        }).sort({ recordedAt: -1 });

        const activeAlerts = await Alert.countDocuments({
          userId: patient._id,
          status: { $in: ['pending', 'acknowledged'] }
        });

        return {
          ...patient.toObject(),
          latestVitals: latestSensorData ? {
            heartRate: latestSensorData.heartRate?.value,
            bloodPressure: `${latestSensorData.bloodPressure?.systolic}/${latestSensorData.bloodPressure?.diastolic}`,
            temperature: latestSensorData.temperature?.value,
            spO2: latestSensorData.spO2?.value,
            lastUpdated: latestSensorData.recordedAt
          } : null,
          activeAlertsCount: activeAlerts
        };
      })
    );

    res.json({
      success: true,
      data: {
        patients: patientsWithVitals,
        total: patientsWithVitals.length
      }
    });
  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/doctor/patient/:patientId
 * @desc    Get detailed patient information for monitoring
 * @access  Private (Doctor/Super Admin only)
 */
router.get('/patient/:patientId', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;

    // Find patient and verify doctor has access
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient',
      $or: [
        { assignedDoctors: doctorId }, // Doctor has access to assigned patients
        { _id: doctorId, role: 'super_admin' } // Super admin has access to all
      ]
    }).populate('assignedDoctors', 'name email');

    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Patient not found or access denied' 
      });
    }

    // Get recent sensor data (last 7 days)
    const recentSensorData = await SensorData.find({
      userId: patientId,
      recordedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ recordedAt: -1 }).limit(168); // 24 hours * 7 days

    // Get patient alerts (last 30 days)
    const patientAlerts = await Alert.find({
      userId: patientId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });

    // Calculate vital signs trends
    const vitalsTrends = {
      heartRate: [],
      bloodPressure: [],
      temperature: [],
      spO2: []
    };

    recentSensorData.forEach(data => {
      if (data.heartRate?.value) {
        vitalsTrends.heartRate.push({
          value: data.heartRate.value,
          timestamp: data.recordedAt
        });
      }
      if (data.bloodPressure?.systolic && data.bloodPressure?.diastolic) {
        vitalsTrends.bloodPressure.push({
          systolic: data.bloodPressure.systolic,
          diastolic: data.bloodPressure.diastolic,
          timestamp: data.recordedAt
        });
      }
      if (data.temperature?.value) {
        vitalsTrends.temperature.push({
          value: data.temperature.value,
          timestamp: data.recordedAt
        });
      }
      if (data.spO2?.value) {
        vitalsTrends.spO2.push({
          value: data.spO2.value,
          timestamp: data.recordedAt
        });
      }
    });

    res.json({
      success: true,
      data: {
        patient: patient.toObject(),
        latestVitals: recentSensorData[0] || null,
        vitalsTrends,
        alerts: patientAlerts,
        statistics: {
          totalAlerts: patientAlerts.length,
          criticalAlerts: patientAlerts.filter(a => a.severity === 'critical').length,
          avgHeartRate: vitalsTrends.heartRate.length > 0 
            ? Math.round(vitalsTrends.heartRate.reduce((sum, v) => sum + v.value, 0) / vitalsTrends.heartRate.length)
            : 0,
          dataPoints: recentSensorData.length
        }
      }
    });
  } catch (error) {
    console.error('Get patient detail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/doctor/patient/:patientId/notes
 * @desc    Add clinical notes for a patient
 * @access  Private (Doctor/Super Admin only)
 */
router.post('/patient/:patientId/notes', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { note, type = 'general', priority = 'normal' } = req.body;
    const doctorId = req.user._id;

    if (!note) {
      return res.status(400).json({ 
        success: false, 
        error: 'Note content is required' 
      });
    }

    // Verify doctor has access to patient
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient',
      assignedDoctors: doctorId
    });

    if (!patient && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this patient' 
      });
    }

    // Add note to patient's clinical notes (we'll need to add this field to the User model)
    await User.findByIdAndUpdate(patientId, {
      $push: {
        clinicalNotes: {
          note,
          type,
          priority,
          addedBy: doctorId,
          addedAt: new Date()
        }
      }
    });

    res.json({
      success: true,
      message: 'Clinical note added successfully'
    });
  } catch (error) {
    console.error('Add clinical note error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/doctor/alerts
 * @desc    Get alerts for doctor's patients
 * @access  Private (Doctor/Super Admin only)
 */
router.get('/alerts', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { severity, status, limit = 20 } = req.query;

    // Get doctor's assigned patients
    const assignedPatients = await User.find({
      role: 'patient',
      assignedDoctors: doctorId
    }).select('_id');

    const patientIds = assignedPatients.map(p => p._id);

    // Build alerts query
    let alertQuery = {
      userId: { $in: patientIds }
    };

    if (severity) alertQuery.severity = severity;
    if (status) alertQuery.status = status;

    const alerts = await Alert.find(alertQuery)
      .populate('userId', 'name patientId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get doctor alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/doctor/prescriptions
 * @desc    Get all prescriptions created by doctor
 * @access  Private (Doctor/Super Admin only)
 */
router.get('/prescriptions', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { search, status, limit = 20, page = 1 } = req.query;

    // Build query
    let query = { doctorId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    let prescriptions = await Prescription.find(query)
      .populate('patientId', 'name patientId email')
      .sort({ createdAt: -1 });

    // Apply search filter after population
    if (search) {
      prescriptions = prescriptions.filter(prescription => {
        const searchLower = search.toLowerCase();
        return (
          prescription.patientId.name.toLowerCase().includes(searchLower) ||
          prescription.patientId.patientId.toLowerCase().includes(searchLower) ||
          prescription.diagnosis.toLowerCase().includes(searchLower) ||
          prescription.medications.some(med => 
            med.name.toLowerCase().includes(searchLower)
          )
        );
      });
    }

    // Paginate results
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPrescriptions = prescriptions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        prescriptions: paginatedPrescriptions,
        total: prescriptions.length,
        totalPages: Math.ceil(prescriptions.length / parseInt(limit)),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/doctor/prescriptions
 * @desc    Create new prescription
 * @access  Private (Doctor/Super Admin only)
 */
router.post('/prescriptions', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { patientId, diagnosis, medications, notes, validUntil } = req.body;

    // Validate required fields
    if (!patientId || !diagnosis || !medications || medications.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Patient, diagnosis, and at least one medication are required' 
      });
    }

    // Verify doctor has access to patient
    const patient = await User.findOne({
      _id: patientId,
      role: 'patient',
      $or: [
        { assignedDoctors: doctorId },
        { _id: doctorId, role: 'super_admin' }
      ]
    });

    if (!patient && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this patient' 
      });
    }

    const prescription = new Prescription({
      patientId,
      doctorId,
      diagnosis,
      medications: medications.filter(med => med.name.trim()), // Filter empty medications
      notes,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    });

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'name patientId email');

    res.status(201).json({
      success: true,
      data: populatedPrescription,
      message: 'Prescription created successfully'
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/doctor/prescriptions/:prescriptionId
 * @desc    Update prescription
 * @access  Private (Doctor/Super Admin only)
 */
router.put('/prescriptions/:prescriptionId', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const doctorId = req.user._id;
    const { diagnosis, medications, notes, status, validUntil } = req.body;

    // Find prescription and verify ownership
    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      $or: [
        { doctorId },
        { _id: doctorId, role: 'super_admin' }
      ]
    });

    if (!prescription && req.user.role !== 'super_admin') {
      return res.status(404).json({ 
        success: false, 
        error: 'Prescription not found or access denied' 
      });
    }

    // Update prescription
    const updateData = {};
    if (diagnosis) updateData.diagnosis = diagnosis;
    if (medications) updateData.medications = medications.filter(med => med.name.trim());
    if (notes) updateData.notes = notes;
    if (status) updateData.status = status;
    if (validUntil) updateData.validUntil = validUntil;

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      updateData,
      { new: true }
    ).populate('patientId', 'name patientId email');

    res.json({
      success: true,
      data: updatedPrescription,
      message: 'Prescription updated successfully'
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/doctor/prescriptions/:prescriptionId
 * @desc    Delete prescription
 * @access  Private (Doctor/Super Admin only)
 */
router.delete('/prescriptions/:prescriptionId', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const doctorId = req.user._id;

    // Find and delete prescription
    const prescription = await Prescription.findOneAndDelete({
      _id: prescriptionId,
      $or: [
        { doctorId },
        { _id: doctorId, role: 'super_admin' }
      ]
    });

    if (!prescription && req.user.role !== 'super_admin') {
      return res.status(404).json({ 
        success: false, 
        error: 'Prescription not found or access denied' 
      });
    }

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/doctor/prescriptions/:prescriptionId
 * @desc    Get single prescription details
 * @access  Private (Doctor/Super Admin only)
 */
router.get('/prescriptions/:prescriptionId', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const doctorId = req.user._id;

    const prescription = await Prescription.findOne({
      _id: prescriptionId,
      $or: [
        { doctorId },
        { _id: doctorId, role: 'super_admin' }
      ]
    }).populate('patientId', 'name patientId email age gender');

    if (!prescription && req.user.role !== 'super_admin') {
      return res.status(404).json({ 
        success: false, 
        error: 'Prescription not found or access denied' 
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;