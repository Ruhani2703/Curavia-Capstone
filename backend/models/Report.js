const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for admin-level reports
    index: true
  },
  type: {
    type: String,
    enum: [
      'weekly', 'monthly', 'quarterly', 'custom',
      'admin_patient_recovery_analysis', 'admin_system_performance_report',
      'admin_emergency_response_analytics', 'admin_hipaa_compliance_report',
      'admin_revenue_analytics'
    ],
    default: 'monthly'
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  vitalStatistics: {
    heartRate: {
      average: Number,
      min: Number,
      max: Number,
      trend: { type: String, enum: ['improving', 'stable', 'declining'] }
    },
    bloodPressure: {
      averageSystolic: Number,
      averageDiastolic: Number,
      minSystolic: Number,
      maxSystolic: Number,
      minDiastolic: Number,
      maxDiastolic: Number,
      trend: { type: String, enum: ['improving', 'stable', 'declining'] }
    },
    spO2: {
      average: Number,
      min: Number,
      max: Number,
      trend: { type: String, enum: ['improving', 'stable', 'declining'] }
    },
    temperature: {
      average: Number,
      min: Number,
      max: Number,
      trend: { type: String, enum: ['improving', 'stable', 'declining'] }
    }
  },
  activityMetrics: {
    totalSteps: Number,
    averageDailySteps: Number,
    activeMinutes: Number,
    sedentaryHours: Number,
    caloriesBurned: Number,
    distanceCovered: Number, // in km
    exerciseCompletionRate: Number // percentage
  },
  medicationAdherence: {
    totalDoses: Number,
    takenDoses: Number,
    missedDoses: Number,
    adherenceRate: Number, // percentage
    medications: [{
      name: String,
      adherenceRate: Number,
      missedDoses: Number
    }]
  },
  dietCompliance: {
    complianceRate: Number, // percentage
    averageDailyCalories: Number,
    averageDailyProteins: Number,
    averageDailyCarbs: Number,
    averageDailyFats: Number,
    waterIntake: Number // liters per day average
  },
  alertsSummary: {
    total: Number,
    critical: Number,
    high: Number,
    medium: Number,
    low: Number,
    resolved: Number,
    averageResponseTime: Number, // in minutes
    mostCommonTypes: [{
      type: String,
      count: Number
    }]
  },
  recoveryProgress: {
    currentProgress: Number, // percentage
    expectedProgress: Number, // percentage
    status: {
      type: String,
      enum: ['ahead_of_schedule', 'on_track', 'slightly_behind', 'significantly_behind']
    },
    milestones: [{
      name: String,
      achieved: Boolean,
      achievedDate: Date,
      expectedDate: Date
    }]
  },
  complications: [{
    date: Date,
    type: String,
    severity: String,
    resolved: Boolean,
    notes: String
  }],
  doctorNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: Date
  }],
  recommendations: {
    diet: [String],
    exercise: [String],
    medication: [String],
    lifestyle: [String],
    followUp: String
  },
  riskAssessment: {
    overallRisk: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    factors: [{
      factor: String,
      level: String,
      recommendation: String
    }]
  },
  graphs: {
    vitalsTrend: String, // Base64 encoded image or URL
    activityTrend: String,
    recoveryProgress: String,
    medicationAdherence: String
  },
  pdfUrl: String,
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: Date,
    accessLevel: {
      type: String,
      enum: ['view', 'comment', 'edit']
    }
  }],
  // Admin report specific data
  adminReportData: {
    type: mongoose.Schema.Types.Mixed // Allow any structure for admin reports
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional metadata for admin reports
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

// Generate summary text for the report
reportSchema.methods.generateSummary = function() {
  const { recoveryProgress, vitalStatistics, activityMetrics, medicationAdherence } = this;
  
  let summary = `Recovery Progress: ${recoveryProgress.currentProgress}% (${recoveryProgress.status.replace(/_/g, ' ')})\n\n`;
  
  summary += `Vital Signs:\n`;
  summary += `- Heart Rate: Avg ${vitalStatistics.heartRate.average} bpm (${vitalStatistics.heartRate.trend})\n`;
  summary += `- Blood Pressure: Avg ${vitalStatistics.bloodPressure.averageSystolic}/${vitalStatistics.bloodPressure.averageDiastolic} mmHg (${vitalStatistics.bloodPressure.trend})\n`;
  summary += `- SpO2: Avg ${vitalStatistics.spO2.average}% (${vitalStatistics.spO2.trend})\n\n`;
  
  summary += `Activity:\n`;
  summary += `- Average Daily Steps: ${activityMetrics.averageDailySteps}\n`;
  summary += `- Exercise Completion: ${activityMetrics.exerciseCompletionRate}%\n\n`;
  
  summary += `Medication Adherence: ${medicationAdherence.adherenceRate}%\n`;
  
  return summary;
};

// Calculate overall health score
reportSchema.methods.calculateHealthScore = function() {
  let score = 0;
  let factors = 0;
  
  // Recovery progress (30 points)
  if (this.recoveryProgress.status === 'ahead_of_schedule') score += 30;
  else if (this.recoveryProgress.status === 'on_track') score += 25;
  else if (this.recoveryProgress.status === 'slightly_behind') score += 15;
  else score += 5;
  factors++;
  
  // Medication adherence (25 points)
  score += (this.medicationAdherence.adherenceRate / 100) * 25;
  factors++;
  
  // Exercise completion (25 points)
  score += (this.activityMetrics.exerciseCompletionRate / 100) * 25;
  factors++;
  
  // Vital signs trends (20 points)
  const vitalsTrends = [
    this.vitalStatistics.heartRate.trend,
    this.vitalStatistics.bloodPressure.trend,
    this.vitalStatistics.spO2.trend
  ];
  
  const trendScore = vitalsTrends.reduce((acc, trend) => {
    if (trend === 'improving') return acc + 6.67;
    if (trend === 'stable') return acc + 5;
    return acc + 2;
  }, 0);
  score += trendScore;
  factors++;
  
  return Math.round(score);
};

module.exports = mongoose.model('Report', reportSchema);