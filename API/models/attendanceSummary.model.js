const mongoose = require('mongoose');

const attendanceSummarySchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  // For student summaries
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  // For teacher summaries
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  // Summary period (daily, weekly, monthly)
  period_type: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Term', 'Yearly'],
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  // Counts
  total_days: {
    type: Number,
    required: true
  },
  present_days: {
    type: Number,
    required: true,
    default: 0
  },
  absent_days: {
    type: Number,
    required: true,
    default: 0
  },
  late_days: {
    type: Number,
    required: true,
    default: 0
  },
  half_days: {
    type: Number,
    required: true,
    default: 0
  },
  excused_days: {
    type: Number,
    required: true,
    default: 0
  },
  // Percentage
  attendance_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
attendanceSummarySchema.index({ school: 1, student: 1, period_type: 1 });
attendanceSummarySchema.index({ school: 1, teacher: 1, period_type: 1 });
attendanceSummarySchema.index({ school: 1, class: 1, period_type: 1 });
attendanceSummarySchema.index({ school: 1, subject: 1, period_type: 1 });

module.exports = mongoose.model('AttendanceSummary', attendanceSummarySchema);