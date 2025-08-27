const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'vital_breach',      // Vital signs out of range
      'fall_detected',     // Fall detection
      'medication_reminder', // Medicine due
      'inactivity',        // No movement detected
      'over_exertion',     // Excessive activity
      'band_disconnected', // Band connection lost
      'low_battery',       // Band battery low
      'emergency',         // Emergency alert
      'system'            // System notifications
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: {
    parameter: String,      // Which parameter triggered (e.g., 'heartRate')
    currentValue: mongoose.Schema.Types.Mixed, // Current value
    normalRange: {
      min: Number,
      max: Number
    },
    medication: {
      name: String,
      dosage: String,
      time: String
    },
    fallDetails: {
      severity: String,
      location: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'resolved', 'escalated'],
    default: 'pending'
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  escalatedTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    escalatedAt: Date
  }],
  autoResolve: {
    type: Boolean,
    default: false
  },
  autoResolveTime: Number, // in minutes
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notificationSent: {
    app: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    buzzer: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
alertSchema.index({ userId: 1, status: 1, createdAt: -1 });
alertSchema.index({ type: 1, severity: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

// Auto-escalate critical alerts after 5 minutes
alertSchema.methods.checkEscalation = function() {
  if (this.severity === 'critical' && this.status === 'pending') {
    const now = new Date();
    const alertAge = (now - this.createdAt) / 1000 / 60; // in minutes
    
    if (alertAge > 5) {
      return true; // Should escalate
    }
  }
  return false;
};

// Format alert for notification
alertSchema.methods.formatForNotification = function() {
  const severityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };
  
  return {
    title: `${severityEmoji[this.severity]} ${this.title}`,
    body: this.message,
    data: {
      alertId: this._id,
      type: this.type,
      severity: this.severity
    }
  };
};

module.exports = mongoose.model('Alert', alertSchema);