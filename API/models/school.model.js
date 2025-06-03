const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    school_name: { type: String, required: true },
    email: { type: String, required: true },
    owner_name: { type: String, required: true },
    school_image: { type: String, required: true },
    password: { type: String, required: true },

    createdAt: { type: Date, default: new Date() },
    resetPasswordToken: {
    type: String, // ✅ FIXED: Should be string, not Object
  },
  resetPasswordExpires: {
    type: Date, // ✅ FIXED: Should be Date, not Object
  },
});

module.exports = mongoose.model("School", schoolSchema);
