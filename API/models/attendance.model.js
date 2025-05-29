const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one attendance record per student per day
attendanceSchema.index({ student: 1, date: 1, school: 1 }, { unique: true });

// Virtual population
attendanceSchema.virtual('studentDetails', {
  ref: 'Student',
  localField: 'student',
  foreignField: '_id',
  justOne: true
});

attendanceSchema.virtual('teacherDetails', {
  ref: 'Teacher',
  localField: 'teacher',
  foreignField: '_id',
  justOne: true
});

attendanceSchema.virtual('classDetails', {
  ref: 'Class',
  localField: 'class',
  foreignField: '_id',
  justOne: true
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;