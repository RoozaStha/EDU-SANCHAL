const StudentAttendance = require('../models/studentAttendance.model');
const Student = require('../models/student.model');
const Class = require('../models/class.model');
const Subject = require('../models/subject.model');
const Teacher = require('../models/teacher.model');
const AttendanceSummary = require('../models/attendanceSummary.model');
const mongoose = require('mongoose');

module.exports = {
  // Mark attendance for a student
  markStudentAttendance: async (req, res) => {
    try {
      const { studentId, subjectId, status, remarks } = req.body;
      const schoolId = req.user.schoolId;
      const markedBy = req.user.role === 'TEACHER' ? 'Teacher' : 'School';

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }

      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subject ID' });
      }

      // Check if student exists and belongs to the school
      const student = await Student.findOne({ _id: studentId, school: schoolId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Check if subject exists and belongs to the school
      const subject = await Subject.findOne({ _id: subjectId, school: schoolId });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      // Check if teacher is assigned to this subject (if marked by teacher)
      if (req.user.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ 
          _id: req.user.id, 
          school: schoolId,
          subjects: subjectId
        });
        if (!teacher) {
          return res.status(403).json({ 
            success: false, 
            message: 'You are not assigned to this subject' 
          });
        }
      }

      // Create attendance record
      const attendance = new StudentAttendance({
        school: schoolId,
        student: studentId,
        class: student.student_class,
        subject: subjectId,
        teacher: req.user.role === 'TEACHER' ? req.user.id : req.body.teacherId,
        date: new Date(),
        status,
        marked_by: markedBy,
        remarks
      });

      await attendance.save();

      // Update attendance summary
      await updateStudentAttendanceSummary(studentId, schoolId);

      res.status(201).json({
        success: true,
        message: 'Attendance marked successfully',
        data: attendance
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Attendance already marked for this student and date'
        });
      }
      console.error('Error marking attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Bulk mark attendance for multiple students
  markBulkStudentAttendance: async (req, res) => {
    try {
      const { classId, subjectId, attendanceData } = req.body;
      const schoolId = req.user.schoolId;
      const markedBy = req.user.role === 'TEACHER' ? 'Teacher' : 'School';

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: 'Invalid class ID' });
      }

      if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ success: false, message: 'Invalid subject ID' });
      }

      // Check if class exists and belongs to the school
      const classExists = await Class.findOne({ _id: classId, school: schoolId });
      if (!classExists) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      // Check if subject exists and belongs to the school
      const subject = await Subject.findOne({ _id: subjectId, school: schoolId });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      // Check if teacher is assigned to this subject (if marked by teacher)
      if (req.user.role === 'TEACHER') {
        const teacher = await Teacher.findOne({ 
          _id: req.user.id, 
          school: schoolId,
          subjects: subjectId
        });
        if (!teacher) {
          return res.status(403).json({ 
            success: false, 
            message: 'You are not assigned to this subject' 
          });
        }
      }

      // Prepare attendance records
      const attendanceRecords = [];
      const today = new Date();
      const errors = [];

      for (const item of attendanceData) {
        try {
          // Check if student exists and belongs to the class
          const student = await Student.findOne({ 
            _id: item.studentId, 
            school: schoolId,
            student_class: classId
          });

          if (!student) {
            errors.push({
              studentId: item.studentId,
              error: 'Student not found in this class'
            });
            continue;
          }

          // Check if attendance already exists for today
          const existingAttendance = await StudentAttendance.findOne({
            student: item.studentId,
            subject: subjectId,
            date: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lt: new Date(today.setHours(23, 59, 59, 999))
            }
          });

          if (existingAttendance) {
            errors.push({
              studentId: item.studentId,
              error: 'Attendance already marked for today'
            });
            continue;
          }

          attendanceRecords.push({
            school: schoolId,
            student: item.studentId,
            class: classId,
            subject: subjectId,
            teacher: req.user.role === 'TEACHER' ? req.user.id : req.body.teacherId,
            date: today,
            status: item.status,
            marked_by: markedBy,
            remarks: item.remarks
          });
        } catch (error) {
          errors.push({
            studentId: item.studentId,
            error: error.message
          });
        }
      }

      // Insert all attendance records
      const result = await StudentAttendance.insertMany(attendanceRecords);

      // Update attendance summaries for all students
      const studentIds = attendanceRecords.map(record => record.student);
      await updateBulkStudentAttendanceSummary(studentIds, schoolId);

      res.status(201).json({
        success: true,
        message: 'Bulk attendance marked successfully',
        data: result,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark bulk attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get student attendance
  getStudentAttendance: async (req, res) => {
    try {
      const { studentId, subjectId, startDate, endDate } = req.query;
      const schoolId = req.user.schoolId;

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }

      // Check permissions
      if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view your own attendance' 
        });
      }

      // Check if student exists and belongs to the school
      const student = await Student.findOne({ _id: studentId, school: schoolId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Build query
      const query = { 
        school: schoolId,
        student: studentId 
      };

      if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        query.subject = subjectId;
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get attendance records
      const attendance = await StudentAttendance.find(query)
        .populate('subject', 'subject_name subject_codename')
        .populate('teacher', 'name email')
        .sort({ date: -1 });

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get class attendance
  getClassAttendance: async (req, res) => {
    try {
      const { classId, subjectId, date } = req.query;
      const schoolId = req.user.schoolId;

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ success: false, message: 'Invalid class ID' });
      }

      // Check if class exists and belongs to the school
      const classExists = await Class.findOne({ _id: classId, school: schoolId });
      if (!classExists) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      // Build query
      const query = { 
        school: schoolId,
        class: classId 
      };

      if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
        query.subject = subjectId;
      }

      if (date) {
        const selectedDate = new Date(date);
        query.date = {
          $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
        };
      } else {
        // Default to today if no date provided
        const today = new Date();
        query.date = {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        };
      }

      // Get attendance records
      const attendance = await StudentAttendance.find(query)
        .populate('student', 'name email student_image')
        .populate('subject', 'subject_name subject_codename')
        .populate('teacher', 'name email')
        .sort({ 'student.name': 1 });

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class attendance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get student attendance summary
  getStudentAttendanceSummary: async (req, res) => {
    try {
      const { studentId, periodType } = req.query;
      const schoolId = req.user.schoolId;
      const validPeriods = ['Daily', 'Weekly', 'Monthly', 'Term', 'Yearly'];

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID' });
      }

      if (periodType && !validPeriods.includes(periodType)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid period type. Valid values are: ${validPeriods.join(', ')}` 
        });
      }

      // Check permissions
      if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only view your own attendance' 
        });
      }

      // Check if student exists and belongs to the school
      const student = await Student.findOne({ _id: studentId, school: schoolId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Build query
      const query = { 
        school: schoolId,
        student: studentId 
      };

      if (periodType) {
        query.period_type = periodType;
      }

      // Get attendance summary
      const summary = await AttendanceSummary.find(query)
        .sort({ start_date: -1 })
        .limit(periodType ? 10 : 50); // Limit results if no period type specified

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance summary',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Helper function to update student attendance summary
async function updateStudentAttendanceSummary(studentId, schoolId) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get all attendance records for the current month
    const attendanceRecords = await StudentAttendance.find({
      school: schoolId,
      student: studentId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // Calculate summary
    const totalDays = new Date(endOfMonth - startOfMonth).getDate();
    const presentDays = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'Absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'Late').length;
    const halfDays = attendanceRecords.filter(r => r.status === 'Half Day').length;
    const excusedDays = attendanceRecords.filter(r => r.status === 'Excused').length;
    const attendancePercentage = Math.round((presentDays / totalDays) * 100);

    // Update or create summary record
    await AttendanceSummary.findOneAndUpdate(
      {
        school: schoolId,
        student: studentId,
        period_type: 'Monthly',
        start_date: startOfMonth,
        end_date: endOfMonth
      },
      {
        $set: {
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          half_days: halfDays,
          excused_days: excusedDays,
          attendance_percentage: attendancePercentage,
          last_updated: now
        }
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating attendance summary:', error);
  }
}

// Helper function to update bulk student attendance summaries
async function updateBulkStudentAttendanceSummary(studentIds, schoolId) {
  try {
    await Promise.all(
      studentIds.map(studentId => 
        updateStudentAttendanceSummary(studentId, schoolId)
    ));
  } catch (error) {
    console.error('Error updating bulk attendance summaries:', error);
  }
}