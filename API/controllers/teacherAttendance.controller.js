// controllers/teacherAttendance.controller.js
const StudentAttendance = require('../models/studentAttendance.model');
const TeacherAttendance = require('../models/teacherAttendance.model');
const Class = require('../models/class.model');
const Teacher = require('../models/teacher.model');
const mongoose = require('mongoose');

// Get classes assigned to teacher
exports.getTeacherClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).populate('class', 'class_text');
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }
    
    res.status(200).json({ 
      success: true, 
      data: teacher.class ? [teacher.class] : [] 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch teacher classes",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Mark attendance for teacher's class
exports.markClassAttendance = async (req, res) => {
  try {
    const { attendances, date } = req.body;
    const teacher = await Teacher.findById(req.user.id);
    
    if (!teacher || !teacher.class) {
      return res.status(400).json({ 
        success: false, 
        message: "Teacher is not assigned to any class" 
      });
    }
    
    // Validate all students belong to teacher's class
    const invalidStudents = attendances.filter(a => 
      !mongoose.Types.ObjectId.isValid(a.studentId)
    );
    if (invalidStudents.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid student IDs provided" 
      });
    }
    
    const attendanceRecords = attendances.map(a => ({
      student: a.studentId,
      class: teacher.class,
      status: a.status,
      date,
    }));
    
    await StudentAttendance.insertMany(attendanceRecords, { ordered: false });
    
    res.status(200).json({ 
      success: true, 
      message: "Attendance recorded successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to record attendance",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get attendance summary for teacher's class
exports.getClassAttendanceSummary = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher || !teacher.class) {
      return res.status(400).json({ 
        success: false, 
        message: "Teacher is not assigned to any class" 
      });
    }
    
    const summary = await StudentAttendance.find({ class: teacher.class })
      .populate('student', 'name student_image')
      .sort({ date: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: summary 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch attendance summary",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get teacher's own attendance records
exports.getTeacherOwnAttendance = async (req, res) => {
  try {
    const records = await TeacherAttendance.find({ teacher: req.user.id })
      .sort({ date: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: records 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch attendance records",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get students in teacher's class
exports.getClassStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher || !teacher.class) {
      return res.status(400).json({ 
        success: false, 
        message: "Teacher is not assigned to any class" 
      });
    }
    
    const students = await Student.find({ student_class: teacher.class })
      .select('name email student_image');
    
    res.status(200).json({ 
      success: true, 
      data: students 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch class students",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};