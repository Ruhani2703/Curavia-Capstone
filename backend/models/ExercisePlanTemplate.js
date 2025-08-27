const mongoose = require('mongoose');

const exercisePlanTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  surgeryType: {
    type: String,
    required: true,
    enum: ['Bariatric', 'Cardiac', 'Orthopedic', 'Neurological', 'General']
  },
  phase: {
    type: String,
    required: true,
    enum: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Maintenance']
  },
  intensity: {
    type: String,
    required: true,
    enum: ['Low', 'Moderate', 'High']
  },
  duration: {
    type: String,
    required: true,
    default: '4 weeks'
  },
  exercises: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['Breathing', 'Stretching', 'Walking', 'Strength', 'Cardio', 'Balance', 'Flexibility']
    },
    duration: String,
    sets: Number,
    reps: Number,
    instructions: String,
    videoUrl: String,
    equipment: [String],
    targetMuscles: [String]
  }],
  weeklyTargets: {
    totalSteps: Number,
    activeMinutes: Number,
    exerciseSessions: Number,
    caloriesBurn: Number
  },
  restrictions: [String],
  precautions: [String],
  progressMilestones: [{
    week: Number,
    description: String,
    targetValue: Number,
    unit: String
  }],
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
exercisePlanTemplateSchema.index({ surgeryType: 1, phase: 1, intensity: 1, isActive: 1 });
exercisePlanTemplateSchema.index({ createdBy: 1, createdAt: -1 });

// Update the updatedAt field before saving
exercisePlanTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ExercisePlanTemplate', exercisePlanTemplateSchema);