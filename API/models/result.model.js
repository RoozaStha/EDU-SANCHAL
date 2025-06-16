const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  examination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Examination',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  marks: {
    type: Number,
    required: true,
    min: 0
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 200
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate percentage before saving
resultSchema.pre('validate', function(next) {
  this.percentage = parseFloat(((this.marks / this.maxMarks) * 100).toFixed(2));
  next();
});

// Compound index to prevent duplicate entries
resultSchema.index({ examination: 1, student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);