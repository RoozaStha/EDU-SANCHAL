const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    qualification: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    teacher_image: { type: String, required: true },
    password: { type: String, required: true },
    classes: [{  // Changed from 'class' to 'classes' (array)
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class'
    }],
    subjects: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject' 
    }],
    is_class_teacher: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Teacher", teacherSchema);