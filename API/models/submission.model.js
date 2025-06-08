const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  fileUrl: {
    type: String,
    required: true
  },
  remarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
