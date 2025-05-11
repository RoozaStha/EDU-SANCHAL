const Notice = require('../models/notice.model');

module.exports = {
    getAllNotices: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allNotices = await Notice.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all Notices.", data: allNotices });
        } catch (error) {
            console.log("GetAllNotices error", error);
            res.status(500).json({ success: false, message: "Server Error in Getting Notices." });
        }
    },

    createNotice: async (req, res) => {
        try {
            const { title, message, audience } = req.body;
            const newNotice = new Notice({
                school: req.user.schoolId,
                title: title,
                message: message,
                audience: audience
            });
            await newNotice.save();
            res.status(201).json({ success: true, message: "Successfully created the Notice." });
        } catch (error) {
            console.log("Create Notice error", error);
            res.status(500).json({ success: false, message: "Server Error in Creating Notice." });
        }
    },

    updateNoticeWithId: async (req, res) => {
        try {
            let id = req.params.id;
            await Notice.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const NoticeAfterUpdate = await Notice.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Notice Updated:", data: NoticeAfterUpdate });
        } catch (error) {
            console.log("Update Notice Error=>", error);
            res.status(500).json({ success: false, message: "Server Error in Updating Notice." });
        }
    },

    deleteNoticeWithId: async (req, res) => {
        try {
            let id = req.params.id;
            let schoolId = req.user.schoolId;
            await Notice.findOneAndDelete({ _id: id, school: schoolId });
            res.status(200).json({ success: true, message: "Notice Deleted Successfully." });
        } catch (error) {
            console.log("Delete Notice Error=>", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Notice." });
        }
    }
};