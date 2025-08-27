const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'super_admin'],
    default: 'patient'
  },
  // Patient specific fields
  patientId: {
    type: String,
    unique: true,
    sparse: true
  },
  surgeryType: {
    type: String,
    enum: ['Cardiac Surgery', 'Orthopedic Surgery', 'Neurological Surgery', 
           'Abdominal Surgery', 'Thoracic Surgery', 'Vascular Surgery', 
           'Transplant Surgery', 'General Surgery', 'Other'],
    required: function() { return this.role === 'patient'; }
  },
  surgeryDate: {
    type: Date,
    required: function() { return this.role === 'patient'; }
  },
  bandId: {
    type: String,
    unique: true,
    sparse: true
  },
  isBandActive: {
    type: Boolean,
    default: false
  },
  // Medical information
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  bloodGroup: String,
  height: Number, // in cm
  weight: Number, // in kg
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  // Doctor-Patient relationships (many-to-many)
  assignedDoctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // ThingSpeak Integration
  thingspeakChannel: {
    channelId: String,
    readApiKey: String,
    writeApiKey: String
  },
  // Recovery tracking
  expectedRecoveryTime: Number, // in days
  actualRecoveryProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Medication schedule
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    timings: [String],
    startDate: Date,
    endDate: Date,
    active: { type: Boolean, default: true }
  }],
  // Diet and Exercise
  dietPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan'
  },
  exercisePlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExercisePlan'
  },
  // Activity tracking
  dailySteps: {
    target: { type: Number, default: 5000 },
    current: { type: Number, default: 0 }
  },
  // Clinical Notes (for doctor observations)
  clinicalNotes: [{
    note: String,
    type: {
      type: String,
      enum: ['general', 'vitals', 'medication', 'surgery', 'recovery'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Password Reset
  resetPasswordOTP: String,
  resetPasswordExpires: Date,
  // Timestamps
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate patient ID
userSchema.pre('save', function(next) {
  if (this.role === 'patient' && !this.patientId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.patientId = `CRV${year}${random}`;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  const { password, ...profile } = this.toObject();
  return profile;
};

module.exports = mongoose.model('User', userSchema);