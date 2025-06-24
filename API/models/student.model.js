const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
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
    name: { type: String, required: true },
    student_class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    age: { type: String, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    guardian: { type: String, required: true },
    guardian_phone: { type: String, required: true },
    student_image: { type: String, required: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: {type:String},
    emailVerificationExpires: {type: Date},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);