const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    school_name: { type: String, required: true },
    email: { 
        type: String, 
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    owner_name: { type: String, required: true },
    school_image: { type: String, required: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: {type: String},
    emailVerificationExpires: {type: Date},
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

module.exports = mongoose.model("School", schoolSchema);