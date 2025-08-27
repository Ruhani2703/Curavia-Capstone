const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescribedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['Once daily', 'Twice daily', 'Thrice daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed']
  },
  timings: [{
    type: String // e.g., "08:00", "14:00", "20:00"
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  instructions: String,
  sideEffects: String,
  active: {
    type: Boolean,
    default: true
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    beforeMinutes: {
      type: Number,
      default: 30
    }
  },
  adherence: [{
    date: Date,
    time: String,
    taken: Boolean,
    takenAt: Date,
    notes: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate adherence percentage
medicationSchema.methods.getAdherencePercentage = function() {
  if (this.adherence.length === 0) return 100;
  const taken = this.adherence.filter(a => a.taken).length;
  return Math.round((taken / this.adherence.length) * 100);
};

module.exports = mongoose.model('Medication', medicationSchema);