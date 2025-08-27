const mongoose = require('mongoose');

const exercisePlanSchema = new mongoose.Schema({
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
  weekNumber: {
    type: Number,
    default: 1
  },
  exercises: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    activities: [{
      name: String,
      type: {
        type: String,
        enum: ['breathing', 'stretching', 'walking', 'strength', 'cardio', 'balance', 'flexibility']
      },
      duration: Number, // in minutes
      sets: Number,
      reps: Number,
      intensity: {
        type: String,
        enum: ['very_light', 'light', 'moderate', 'vigorous']
      },
      instructions: String,
      videoUrl: String,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }],
    targetSteps: Number,
    actualSteps: Number,
    restDay: {
      type: Boolean,
      default: false
    }
  }],
  weeklyTargets: {
    totalSteps: Number,
    activeMinutes: Number,
    exerciseSessions: Number,
    caloriesBurn: Number
  },
  restrictions: [String],
  precautions: [String],
  progressTracking: [{
    week: Number,
    stepsAchieved: Number,
    exercisesCompleted: Number,
    totalExercises: Number,
    painLevel: {
      type: Number,
      min: 0,
      max: 10
    },
    fatigue: {
      type: String,
      enum: ['none', 'mild', 'moderate', 'severe']
    },
    notes: String,
    recordedAt: {
      type: Date,
      default: Date.now
    }
  }],
  adjustmentHistory: [{
    date: Date,
    reason: String,
    changes: String,
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  motivationalQuotes: [{
    quote: String,
    author: String,
    displayDate: Date
  }],
  achievements: [{
    title: String,
    description: String,
    icon: String,
    unlockedAt: Date
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

// Calculate weekly progress
exercisePlanSchema.methods.calculateWeeklyProgress = function() {
  const currentWeek = this.exercises;
  let completedActivities = 0;
  let totalActivities = 0;
  let totalSteps = 0;
  
  currentWeek.forEach(day => {
    if (!day.restDay) {
      day.activities.forEach(activity => {
        totalActivities++;
        if (activity.completed) {
          completedActivities++;
        }
      });
      totalSteps += day.actualSteps || 0;
    }
  });
  
  return {
    completionRate: totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0,
    stepsAchieved: totalSteps,
    stepsTarget: this.weeklyTargets.totalSteps,
    stepsProgress: this.weeklyTargets.totalSteps > 0 ? (totalSteps / this.weeklyTargets.totalSteps) * 100 : 0
  };
};

// Check for achievements
exercisePlanSchema.methods.checkAchievements = function() {
  const newAchievements = [];
  const progress = this.calculateWeeklyProgress();
  
  // First week completion
  if (this.weekNumber === 1 && progress.completionRate >= 80) {
    newAchievements.push({
      title: 'First Week Champion',
      description: 'Completed your first week of exercises!',
      icon: '🏆'
    });
  }
  
  // Steps milestone
  const totalSteps = this.progressTracking.reduce((sum, week) => sum + week.stepsAchieved, 0);
  if (totalSteps >= 10000 && !this.achievements.find(a => a.title === '10K Steps')) {
    newAchievements.push({
      title: '10K Steps',
      description: 'Walked 10,000 steps total!',
      icon: '👟'
    });
  }
  
  return newAchievements;
};

module.exports = mongoose.model('ExercisePlan', exercisePlanSchema);