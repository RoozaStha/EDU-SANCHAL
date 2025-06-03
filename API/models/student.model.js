const mongoose = require('mongoose');

// Define the schema for Student
const studentSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School', // Reference to the 'School' model
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures unique email addresses
      trim: true, // Removes extra spaces
      lowercase: true, // Converts to lowercase
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    student_class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: props => `${props.value} is not a valid class id!`
      },
      default: null
    },
    age: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'], // Restricts values
    },
    guardian: {
      type: String,
      required: true,
    },
    guardian_phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, 'Invalid phone number'], // Ensures a 10-digit number
    },
    student_image: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // Ensures a minimum password length
    },
    createdAt: {
      type: Date,
      default: Date.now, // Uses the current timestamp
    },
    resetPasswordToken: {
    type: String, // ✅ FIXED: Should be string, not Object
  },
  resetPasswordExpires: {
    type: Date, // ✅ FIXED: Should be Date, not Object
  },
  },
  { timestamps: true } // Enables 'createdAt' and 'updatedAt'
);

// Export the model
module.exports = mongoose.model('Student', studentSchema);
