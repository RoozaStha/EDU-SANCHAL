const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School reference is required']
  },
  subject_name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    minlength: [3, 'Subject name must be at least 3 characters'],
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  subject_codename: {
    type: String,
    required: [true, 'Subject codename is required'],
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]{3,10}$/.test(v);
      },
      message: 'Codename must be 3-10 alphanumeric characters'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create compound index
subjectSchema.index({ school: 1, subject_codename: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);