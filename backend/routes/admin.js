const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (with filters)
 * @access  Private (Super Admin only)
 */
router.get('/users', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    
    // Build query
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('assignedDoctors', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new user (doctor or patient)
 * @access  Private (Super Admin only)
 */
router.post('/users', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      // Patient specific fields
      surgeryType,
      surgeryDate,
      age,
      gender,
      bloodGroup,
      height,
      weight,
      emergencyContact,
      bandId,
      assignedDoctor,
      riskLevel,
      // Doctor specific fields
      specialization,
      licenseNumber,
      department,
      phone
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Name, email, password, and role are required' 
      });
    }

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either patient or doctor' 
      });
    }

    // Check if patient-specific fields are provided for patient role
    if (role === 'patient' && (!surgeryType || !surgeryDate)) {
      return res.status(400).json({ 
        error: 'Surgery type and date are required for patients' 
      });
    }

    // Check if doctor-specific fields are provided for doctor role
    if (role === 'doctor' && (!specialization || !department)) {
      return res.status(400).json({ 
        error: 'Specialization and department are required for doctors' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Generate patient ID for patients
    let patientId;
    if (role === 'patient') {
      const patientCount = await User.countDocuments({ role: 'patient' });
      patientId = `CRV-${new Date().getFullYear()}-${String(patientCount + 1).padStart(3, '0')}`;
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role,
      status: 'active',
      createdBy: req.user._id
    };

    // Add role-specific fields
    if (role === 'patient') {
      Object.assign(userData, {
        patientId,
        surgeryType,
        surgeryDate,
        age,
        gender,
        bloodGroup,
        height,
        weight,
        emergencyContact,
        bandId,
        assignedDoctor,
        riskLevel: riskLevel || 'low',
        isBandActive: !!bandId
      });
    } else if (role === 'doctor') {
      Object.assign(userData, {
        specialization,
        licenseNumber,
        department,
        phone
      });
    }

    const user = new User(userData);
    await user.save();

    // Populate assignedDoctor if it's a patient
    if (role === 'patient' && assignedDoctor) {
      await user.populate('assignedDoctor', 'name email');
    }

    // Return user data without password
    const userProfile = user.getPublicProfile();

    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      user: userProfile
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  Private (Super Admin only)
 */
router.put('/users/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Fields that cannot be updated
    const restrictedFields = ['email', 'password', 'role', '_id'];
    restrictedFields.forEach(field => delete updates[field]);

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .select('-password')
    .populate('assignedDoctors', 'name email');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete - set status to inactive)
 * @access  Private (Super Admin only)
 */
router.delete('/users/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin users
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin users' });
    }

    // Soft delete - just set status to inactive
    user.status = 'inactive';
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      message: 'User deleted successfully',
      userId: id 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Private (Super Admin only)
 */
router.get('/users/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .populate('assignedDoctors', 'name email')
      .populate('dietPlan')
      .populate('exercisePlan');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/doctors
 * @desc    Get all doctors (for assignment dropdown)
 * @access  Private (Super Admin only)
 */
router.get('/doctors', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', status: 'active' })
      .select('_id name email specialization department');

    res.json({ doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/admin/statistics
 * @desc    Get admin dashboard statistics
 * @access  Private (Super Admin only)
 */
router.get('/statistics', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const [
      totalPatients,
      activePatients,
      totalDoctors,
      highRiskPatients,
      newPatientsThisMonth
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'patient', status: 'active' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient', riskLevel: 'high' }),
      User.countDocuments({
        role: 'patient',
        createdAt: { 
          $gte: new Date(new Date().setDate(1)) // First day of current month
        }
      })
    ]);

    res.json({
      totalPatients,
      activePatients,
      totalDoctors,
      highRiskPatients,
      newPatientsThisMonth
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Super Admin only)
 */
router.post('/users/:id/reset-password', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({ 
      message: 'Password reset successfully',
      userId: id 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;