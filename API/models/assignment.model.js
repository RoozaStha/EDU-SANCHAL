const mongoose = require('mongoose');

const rubricCriteriaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  maxScore: { type: Number, required: true }
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  dueDate: { type: Date, required: true },
  attachments: [String], // Array of file URLs
  videoUrl: String,
  rubric: [rubricCriteriaSchema], // Rubric-based marking
  maxPoints: { type: Number, default: 100 },
  allowLateSubmission: { type: Boolean, default: false },
  peerReviewEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

const submissionSchema = new mongoose.Schema({
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
  fileUrl: String,
  videoUrl: String, // Student video submission
  remarks: String,
  grade: Number,
  feedback: String,
  feedbackVideoUrl: String, // Teacher video feedback
  rubricScores: [{
    criteriaId: mongoose.Schema.Types.ObjectId,
    score: Number
  }],
  lateSubmission: { type: Boolean, default: false },
  extensionGranted: Date,
  gradedAt: Date
}, {
  timestamps: true
});

module.exports = {
  Assignment: mongoose.model('Assignment', assignmentSchema),
  AssignmentSubmission: mongoose.model('AssignmentSubmission', submissionSchema)
};