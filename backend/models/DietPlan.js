const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  surgeryType: {
    type: String,
    required: true
  },
  phase: {
    type: String,
    enum: ['immediate_post_surgery', 'early_recovery', 'mid_recovery', 'late_recovery', 'maintenance'],
    default: 'immediate_post_surgery'
  },
  basedOnVitals: {
    bloodPressure: {
      status: { type: String, enum: ['low', 'normal', 'high'] },
      recommendations: [String]
    },
    bloodSugar: {
      status: { type: String, enum: ['low', 'normal', 'high'] },
      recommendations: [String]
    },
    heartRate: {
      status: { type: String, enum: ['low', 'normal', 'high'] },
      recommendations: [String]
    }
  },
  meals: {
    breakfast: {
      time: String,
      items: [String],
      calories: Number,
      proteins: Number,
      carbs: Number,
      fats: Number,
      instructions: String
    },
    midMorningSnack: {
      time: String,
      items: [String],
      calories: Number,
      instructions: String
    },
    lunch: {
      time: String,
      items: [String],
      calories: Number,
      proteins: Number,
      carbs: Number,
      fats: Number,
      instructions: String
    },
    eveningSnack: {
      time: String,
      items: [String],
      calories: Number,
      instructions: String
    },
    dinner: {
      time: String,
      items: [String],
      calories: Number,
      proteins: Number,
      carbs: Number,
      fats: Number,
      instructions: String
    }
  },
  dailyTargets: {
    calories: { min: Number, max: Number },
    proteins: { min: Number, max: Number }, // in grams
    carbs: { min: Number, max: Number },    // in grams
    fats: { min: Number, max: Number },     // in grams
    fiber: { min: Number, max: Number },    // in grams
    water: { min: Number, max: Number }     // in liters
  },
  restrictions: [String],
  supplements: [{
    name: String,
    dosage: String,
    timing: String,
    reason: String
  }],
  specialInstructions: [String],
  adjustmentHistory: [{
    date: Date,
    reason: String,
    changes: String,
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Auto-generate diet recommendations based on vitals
dietPlanSchema.methods.generateRecommendations = function(vitals) {
  const recommendations = [];
  
  // Blood pressure based recommendations
  if (vitals.bloodPressure) {
    const { systolic, diastolic } = vitals.bloodPressure;
    if (systolic > 140 || diastolic > 90) {
      recommendations.push('Reduce sodium intake to less than 2300mg per day');
      recommendations.push('Increase potassium-rich foods (bananas, spinach, beans)');
      recommendations.push('Limit caffeine and alcohol');
    } else if (systolic < 90 || diastolic < 60) {
      recommendations.push('Increase salt intake moderately');
      recommendations.push('Stay hydrated with electrolyte-rich fluids');
      recommendations.push('Eat small, frequent meals');
    }
  }
  
  // Heart rate based recommendations
  if (vitals.heartRate) {
    if (vitals.heartRate > 100) {
      recommendations.push('Avoid stimulants like coffee and energy drinks');
      recommendations.push('Include omega-3 rich foods (fish, walnuts)');
    }
  }
  
  // Temperature based recommendations
  if (vitals.temperature > 99.5) {
    recommendations.push('Increase fluid intake');
    recommendations.push('Eat light, easily digestible foods');
    recommendations.push('Include vitamin C rich foods');
  }
  
  return recommendations;
};

module.exports = mongoose.model('DietPlan', dietPlanSchema);