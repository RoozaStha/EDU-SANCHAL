const Examination = require("../models/examination.model");

module.exports = {

    newExamination: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const { date, subjectId, examType, classId } = req.body;

            const newExamination = new Examination({
                school: schoolId,
                examDate: date,
                subject: subjectId,
                examType: examType,
                class: classId,
            });

            const savedData = await newExamination.save();
            return res.status(200).json({
                success: true,
                message: "Success in creating new Examination.",
                data: savedData
            });
        } catch (error) {
            console.error("Create Error:", error);
            return res.status(500).json({
                success: false,
                message: "Error in Creating New Examination."
            });
        }
    },

    getAllExaminations: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examinations = await Examination.find({ school: schoolId });
            return res.status(200).json({ success: true, examinations });
        } catch (error) {
            console.error("Fetch All Error:", error);
            return res.status(500).json({ success: false, message: "Error in Fetching Examinations." });
        }
    },

    getExaminationsByClass: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const classId = req.params.id;
            const examinations = await Examination.find({ class: classId, school: schoolId });
            return res.status(200).json({ success: true, examinations });
        } catch (error) {
            console.error("Fetch by Class Error:", error);
            return res.status(500).json({ success: false, message: "Error in Fetching Examinations." });
        }
    },

    updateExaminationWithId: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examinationId = req.params.id;
            const { date, subjectId, examType } = req.body;

            const updated = await Examination.findOneAndUpdate(
                { _id: examinationId, school: schoolId },
                { $set: { examDate: date, subject: subjectId, examType: examType } },
                { new: true }
            );

            if (!updated) {
                return res.status(404).json({ success: false, message: "Examination not found." });
            }

            return res.status(200).json({ success: true, message: "Examination is updated successfully.", data: updated });
        } catch (error) {
            console.error("Update Error:", error);
            return res.status(500).json({ success: false, message: "Error in Updating Examination." });
        }
    },

    deleteExaminationWithId: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examinationId = req.params.id;

            const deleted = await Examination.findOneAndDelete({ _id: examinationId, school: schoolId });

            if (!deleted) {
                return res.status(404).json({ success: false, message: "Examination not found." });
            }

            return res.status(200).json({ success: true, message: "Examination is deleted successfully." });
        } catch (error) {
            console.error("Delete Error:", error);
            return res.status(500).json({ success: false, message: "Error in Deleting Examination." });
        }
    }
};
