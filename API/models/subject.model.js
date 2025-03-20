const mongoose = require('mongoose');

// Define the schema for Subject
const subjectSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School', // Reference to the 'School' model
      required: true,
    },
    subject_name: {
      type: String,
      required: true,
      trim: true, // Removes extra spaces
      minlength: 3, // Ensures at least 3 characters
    },
    subject_codename: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // Converts to uppercase automatically
    },
    createdAt: {
      type: Date,
      default: Date.now, // Uses the current timestamp
    },
  },
  { timestamps: true } // Enables 'createdAt' and 'updatedAt'
);

// Export the model
module.exports = mongoose.model('Subject', subjectSchema);
