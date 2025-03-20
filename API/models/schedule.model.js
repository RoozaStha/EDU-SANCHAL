const mongoose = require('mongoose');

// Define the schema for Schedule
const scheduleSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', // Reference to the 'School' model
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher', // Reference to the 'Teacher' model
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject', // Reference to the 'Subject' model
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class', // Reference to the 'Class' model
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Uses the current timestamp
  },
});

// Export the model
module.exports = mongoose.model('Schedule', scheduleSchema);
