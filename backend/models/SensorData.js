const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bandId: {
    type: String,
    required: true,
    index: true
  },
  // Vital signs from sensors
  heartRate: {
    value: Number,
    unit: { type: String, default: 'bpm' },
    timestamp: { type: Date, default: Date.now }
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number,
    unit: { type: String, default: 'mmHg' },
    timestamp: { type: Date, default: Date.now }
  },
  spO2: {
    value: Number,
    unit: { type: String, default: '%' },
    timestamp: { type: Date, default: Date.now }
  },
  temperature: {
    value: Number,
    unit: { type: String, default: 'F' },
    timestamp: { type: Date, default: Date.now }
  },
  ecg: {
    value: Number,
    rawData: [Number],
    timestamp: { type: Date, default: Date.now }
  },
  // Movement and activity data
  movement: {
    steps: Number,
    distance: Number, // in meters
    calories: Number,
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
    },
    timestamp: { type: Date, default: Date.now }
  },
  // Fall detection
  fallDetected: {
    type: Boolean,
    default: false
  },
  fallDetails: {
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe']
    },
    location: {
      latitude: Number,
      longitude: Number
    },
    timestamp: Date
  },
  // ThingSpeak integration
  thingspeakData: {
    channelId: String,
    entryId: Number,
    field1: Number, // BPM
    field2: Number, // SpO2
    field3: Number, // Temperature
    field4: Number, // ECG
    createdAt: Date
  },
  // Data quality
  dataQuality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  // Timestamps
  recordedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
  // Temporarily disable time-series collection for debugging
  // timeseries: {
  //   timeField: 'recordedAt',
  //   metaField: 'userId',
  //   granularity: 'minutes'
  // }
});

// Indexes for efficient queries
sensorDataSchema.index({ userId: 1, recordedAt: -1 });
sensorDataSchema.index({ bandId: 1, recordedAt: -1 });
sensorDataSchema.index({ 'heartRate.value': 1, 'spO2.value': 1 });

// Check if vitals are in normal range
sensorDataSchema.methods.checkVitals = function() {
  const alerts = [];
  
  if (this.heartRate.value < 60 || this.heartRate.value > 100) {
    alerts.push({
      type: 'heartRate',
      value: this.heartRate.value,
      message: `Heart rate ${this.heartRate.value < 60 ? 'too low' : 'too high'}: ${this.heartRate.value} bpm`
    });
  }
  
  if (this.spO2.value < 95) {
    alerts.push({
      type: 'spO2',
      value: this.spO2.value,
      message: `Low oxygen saturation: ${this.spO2.value}%`
    });
  }
  
  if (this.temperature.value > 99.5) {
    alerts.push({
      type: 'temperature',
      value: this.temperature.value,
      message: `Elevated temperature: ${this.temperature.value}°F`
    });
  }
  
  if (this.bloodPressure.systolic > 140 || this.bloodPressure.diastolic > 90) {
    alerts.push({
      type: 'bloodPressure',
      value: `${this.bloodPressure.systolic}/${this.bloodPressure.diastolic}`,
      message: `High blood pressure: ${this.bloodPressure.systolic}/${this.bloodPressure.diastolic} mmHg`
    });
  }
  
  return alerts;
};

module.exports = mongoose.model('SensorData', sensorDataSchema);