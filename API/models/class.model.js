const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  school: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: true 
  },
  class_text: { 
    type: String, 
    required: true,
    trim: true
  },
  class_num: { 
    type: Number, 
    required: true,
    min: 1
  },
  class_teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for students in this class
classSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'student_class',
  justOne: false
});

// Pre-remove hook to handle cleanup
classSchema.pre('remove', async function(next) {
  try {
    // Remove class reference from teachers
    await mongoose.model('Teacher').updateMany(
      { class_teacher_of: this._id },
      { $unset: { class_teacher_of: "" } }
    );
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Class", classSchema);