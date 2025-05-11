const mongoose = require('mongoose');

const examinationSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: "School" },
    examDate: { type: Date, required: true },
    subject: { type: String, required: true }, // Changed from ObjectId to String
    examType: { type: String, required: true }, // Changed field name from 'type' to 'examType'
    class: { type: mongoose.Schema.ObjectId, ref: "Class" },
    createdAt: { type: Date, default: new Date() }
});

module.exports = mongoose.model("Examination", examinationSchema);