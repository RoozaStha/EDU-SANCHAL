const Subject = require('../models/subject.model');
const Exam = require("../models/examination.model");
const Schedule = require("../models/schedule.model");

module.exports = {
  getAllSubjects: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allSubjects = await Subject.find({ school: schoolId })
        .select('-__v -createdAt -updatedAt')
        .lean();

      res.status(200).json({ 
        success: true, 
        data: allSubjects 
      });
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch subjects",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  createSubject: async (req, res) => {
    try {
      // Verify schoolId exists in auth token
      if (!req.user?.schoolId) {
        return res.status(400).json({
          success: false,
          message: "School context missing in authentication"
        });
      }

      const { subject_name, subject_codename } = req.body;

      // Check for existing subject with same codename
      const existingSubject = await Subject.findOne({
        school: req.user.schoolId,
        subject_codename: subject_codename.toUpperCase()
      });

      if (existingSubject) {
        return res.status(409).json({
          success: false,
          message: "Subject with this codename already exists"
        });
      }

      const newSubject = new Subject({
        school: req.user.schoolId, // Now properly set from auth token
        subject_name,
        subject_codename: subject_codename.toUpperCase()
      });

      await newSubject.save();

      res.status(201).json({
        success: true,
        message: "Subject created successfully",
        data: {
          _id: newSubject._id,
          subject_name: newSubject.subject_name,
          subject_codename: newSubject.subject_codename
        }
      });

    } catch (err) {
      console.error("Error creating subject:", err);
      res.status(500).json({
        success: false,
        message: "Failed to create subject",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  updateSubjectWithId: async (req, res) => {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;
      
      // Check if subject exists and belongs to the school
      const subject = await Subject.findOne({ _id: id, school: schoolId });
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found"
        });
      }

      // Prevent codename duplication
      if (req.body.subject_codename) {
        const existingSubject = await Subject.findOne({
          _id: { $ne: id },
          school: schoolId,
          subject_codename: req.body.subject_codename.toUpperCase()
        });
        if (existingSubject) {
          return res.status(409).json({
            success: false,
            message: "Subject with this codename already exists"
          });
        }
      }

      const updatedSubject = await Subject.findOneAndUpdate(
        { _id: id, school: schoolId },
        { $set: req.body },
        { new: true, runValidators: true }
      ).select('-__v -createdAt -updatedAt');

      res.status(200).json({ 
        success: true, 
        message: 'Subject updated successfully',
        data: updatedSubject 
      });
    } catch (error) {
      console.error("Error updating subject:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update subject",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  deleteSubjectWithId: async (req, res) => {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      // Check if subject exists
      const subject = await Subject.findOne({ _id: id, school: schoolId });
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found"
        });
      }

      // Check references
      const [examCount, scheduleCount] = await Promise.all([
        Exam.countDocuments({ subject: id, school: schoolId }),
        Schedule.countDocuments({ subject: id, school: schoolId })
      ]);

      if (examCount > 0 || scheduleCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete subject as it is referenced in exams or schedules' 
        });
      }

      await Subject.deleteOne({ _id: id, school: schoolId });
      
      res.status(200).json({ 
        success: true, 
        message: 'Subject deleted successfully' 
      });
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete subject",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};