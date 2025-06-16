const Examination = require("../models/examination.model");

module.exports = {
     newExamination: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const { date, subject, examType, classId } = req.body;

            // Validate required fields
            if (!date || !subject || !examType || !classId) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required: date, subject, examType, classId"
                });
            }

            const newExamination = new Examination({
                school: schoolId,
                examDate: date,
                subject: subject,
                examType: examType,
                class: classId,
            });

            const savedData = await newExamination.save();
            return res.status(200).json({
                success: true,
                message: "Examination created successfully",
                data: savedData
            });
        } catch (error) {
            console.error("Create Error:", error);
            
            // Handle enum validation error
            if (error.name === 'ValidationError' && error.errors?.examType) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid exam type. Valid options: 1st Term Exam, 2nd Term Exam, 3rd Term Exam, Final Term Exam"
                });
            }
            
            return res.status(500).json({
                success: false,
                message: "Error in creating examination"
            });
        }
    },

    getAllExaminations: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examinations = await Examination.find({ school: schoolId })
                .populate('subject', 'subject_name')
                .populate('class', 'class_text');
            return res.status(200).json({ success: true, examinations });
        } catch (error) {
            console.error("Fetch All Error:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error in fetching examinations" 
            });
        }
    },

    getExaminationsByClass: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const classId = req.params.id;
            const examinations = await Examination.find({ 
                class: classId, 
                school: schoolId 
            })
            .populate('subject', 'subject_name')
            .populate('class', 'class_text');
            
            return res.status(200).json({ 
                success: true, 
                examinations 
            });
        } catch (error) {
            console.error("Fetch by Class Error:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error in fetching examinations" 
            });
        }
    },

    updateExaminationWithId: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examinationId = req.params.id;
            const { date, subject, examType } = req.body;

            const updated = await Examination.findOneAndUpdate(
                { _id: examinationId, school: schoolId },
                { 
                    $set: { 
                        examDate: date, 
                        subject: subject, 
                        examType: examType 
                    } 
                },
                { new: true }
            ).populate('subject', 'subject_name')
             .populate('class', 'class_text');

            if (!updated) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Examination not found" 
                });
            }

            return res.status(200).json({ 
                success: true, 
                message: "Examination updated successfully", 
                data: updated 
            });
        } catch (error) {
            console.error("Update Error:", error);
            
            // Handle enum validation error
            if (error.name === 'ValidationError' && error.errors?.examType) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid exam type. Valid options: 1st Term Exam, 2nd Term Exam, 3rd Term Exam, Final Term Exam"
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                message: "Error in updating examination" 
            });
        }
    },

    deleteExaminationWithId: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examinationId = req.params.id;

            const deleted = await Examination.findOneAndDelete({ 
                _id: examinationId, 
                school: schoolId 
            });

            if (!deleted) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Examination not found" 
                });
            }

            return res.status(200).json({ 
                success: true, 
                message: "Examination deleted successfully" 
            });
        } catch (error) {
            console.error("Delete Error:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error in deleting examination" 
            });
        }
    }
};