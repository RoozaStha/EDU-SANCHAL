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
    class: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class',
        default: null
    },
    is_class_teacher: {
        type: Boolean,
        default: false
    },
    subjects: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subject' 
    }],
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to ensure only one class teacher per class
teacherSchema.pre('save', async function(next) {
    if (this.isModified('is_class_teacher') && this.is_class_teacher && this.class) {
        const existingClassTeacher = await mongoose.model('Teacher').findOne({
            class: this.class,
            is_class_teacher: true,
            _id: { $ne: this._id }
        });
        
        if (existingClassTeacher) {
            throw new Error(`Class already has a class teacher: ${existingClassTeacher.name}`);
        }
    }
    next();
});

module.exports = mongoose.model('Teacher', teacherSchema);