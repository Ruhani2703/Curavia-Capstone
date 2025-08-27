const mongoose = require('mongoose');

const dietPlanTemplateSchema = new mongoose.Schema({
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
  duration: {
    type: String,
    required: true,
    default: '4 weeks'
  },
  dailyCalories: {
    type: Number,
    required: true
  },
  dailyProtein: {
    type: Number,
    required: true
  },
  meals: [{
    name: {
      type: String,
      required: true
    },
    time: String,
    items: [String],
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    instructions: String
  }],
  nutritionalGuidelines: {
    carbs: { min: Number, max: Number },
    fats: { min: Number, max: Number },
    fiber: { min: Number, max: Number },
    sodium: { max: Number },
    water: { min: Number }
  },
  restrictions: [String],
  supplements: [{
    name: String,
    dosage: String,
    timing: String,
    reason: String
  }],
  specialInstructions: [String],
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
dietPlanTemplateSchema.index({ surgeryType: 1, phase: 1, isActive: 1 });
dietPlanTemplateSchema.index({ createdBy: 1, createdAt: -1 });

// Update the updatedAt field before saving
dietPlanTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DietPlanTemplate', dietPlanTemplateSchema);