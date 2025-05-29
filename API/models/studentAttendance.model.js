const mongoose = require('mongoose');

const studentAttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent'], required: true },
}, { timestamps: true });

studentAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
