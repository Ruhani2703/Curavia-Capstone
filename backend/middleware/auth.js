const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'curavia_jwt_secret_key_2024';

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Please authenticate' });
  }
};

/**
 * Check if user is super admin
 */
const requireSuperAdmin = async (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

/**
 * Check if user is doctor or super admin
 */
const requireDoctorOrSuperAdmin = async (req, res, next) => {
  if (req.user.role !== 'doctor' && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Doctor or super admin access required' });
  }
  next();
};

/**
 * Check if user is patient
 */
const isPatient = async (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Patient access only' });
  }
  next();
};

/**
 * Check if user can access patient data
 * (patient can access own data, doctor can access assigned patients, admin can access all)
 */
const canAccessPatientData = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.params.userId;
    
    // Super admin can access all
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Patient can only access own data
    if (req.user.role === 'patient') {
      if (req.user._id.toString() !== patientId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return next();
    }
    
    // Doctor can access assigned patients
    if (req.user.role === 'doctor') {
      const patient = await User.findById(patientId);
      if (!patient || patient.assignedDoctor?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return next();
    }
    
    res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Require specific role middleware
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Allow if user has the required role
    if (req.user.role === role) {
      return next();
    }
    
    // Also allow super_admin for any role requirement (super_admin has all permissions)
    if (req.user.role === 'super_admin' && role !== 'patient') {
      return next();
    }
    
    return res.status(403).json({ 
      error: `Access denied. ${role.charAt(0).toUpperCase() + role.slice(1)} role required` 
    });
  };
};

module.exports = {
  generateToken,
  authenticate,
  requireSuperAdmin,
  requireDoctorOrSuperAdmin,
  isPatient,
  canAccessPatientData,
  requireRole
};