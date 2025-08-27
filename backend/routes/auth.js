const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      patientId,
      surgeryType,
      surgeryDate,
      age,
      gender,
      bloodGroup,
      height,
      weight,
      emergencyContact,
      isWearingBand,
      bandId
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if patient-specific fields are provided for patient role
    if (role === 'patient' && (!surgeryType || !surgeryDate)) {
      return res.status(400).json({ error: 'Surgery type and date are required for patients' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'patient',
      patientId: role === 'patient' ? patientId : undefined,
      surgeryType,
      surgeryDate,
      age,
      gender,
      bloodGroup,
      height,
      weight,
      emergencyContact,
      bandId: isWearingBand ? bandId : undefined,
      isBandActive: isWearingBand || false
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userProfile = user.getPublicProfile();

    res.status(201).json({
      message: 'User registered successfully',
      user: userProfile,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, patientId, isWearingBand } = req.body;

    // Validate input
    if ((!email && !patientId) || !password) {
      return res.status(400).json({ error: 'Email/Patient ID and password are required' });
    }

    // Find user by email or patientId
    const user = await User.findOne(
      email ? { email } : { patientId }
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login and band status
    user.lastLogin = new Date();
    if (user.role === 'patient' && isWearingBand !== undefined) {
      user.isBandActive = isWearingBand;
    }
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get band status (if patient)
    let bandStatus = null;
    if (user.role === 'patient' && user.isBandActive) {
      // In production, you'd check actual band connectivity
      bandStatus = {
        connected: user.isBandActive,
        battery: 85, // Mock data
        lastSync: '2 minutes ago'
      };
    }

    // Return user data without password
    const userProfile = user.getPublicProfile();

    res.json({
      message: 'Login successful',
      user: userProfile,
      token,
      bandStatus
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If the email exists, an OTP has been sent' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 600000); // 10 minutes

    // Store OTP in database
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // TODO: Configure nodemailer and send actual email
    // For now, return OTP in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.json({ 
      message: 'If the email exists, an OTP has been sent to your email',
      ...(isDevelopment && { dev_otp: otp })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password are required' });
    }

    // Find user and verify OTP
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('assignedDoctors', 'name email')
      .populate('assignedPatients', 'name email');

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/update-profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    
    // Fields that cannot be updated
    const restrictedFields = ['email', 'password', 'role', 'patientId'];
    restrictedFields.forEach(field => delete updates[field]);

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ 
      message: 'Profile updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/verify-band
 * @desc    Verify and connect wearable band
 * @access  Private (Patient only)
 */
router.post('/verify-band', authenticate, async (req, res) => {
  try {
    const { bandId } = req.body;

    if (!bandId) {
      return res.status(400).json({ error: 'Band ID is required' });
    }

    // Check if band ID is already in use
    const existingBand = await User.findOne({ bandId, _id: { $ne: req.user._id } });
    if (existingBand) {
      return res.status(400).json({ error: 'This band is already registered to another user' });
    }

    // Update user's band information
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        bandId,
        isBandActive: true,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Band connected successfully',
      user,
      bandStatus: {
        connected: true,
        bandId,
        battery: 100,
        lastSync: 'Just now'
      }
    });
  } catch (error) {
    console.error('Verify band error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client should remove token)
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // In a more complex setup, you might want to:
    // 1. Blacklist the token
    // 2. Clear server-side sessions
    // 3. Log the logout event

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;