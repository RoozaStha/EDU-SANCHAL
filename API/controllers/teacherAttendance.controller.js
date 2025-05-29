// controllers/teacherAttendance.controller.js
const TeacherAttendance = require('../models/teacherAttendance.model');
const Teacher = require('../models/teacher.model');
const mongoose = require('mongoose');
const moment = require('moment');

// Mark attendance for multiple teachers
exports.markAttendance = async (req, res) => {
  try {
    const { date, attendanceData } = req.body;
    
    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: "Date and attendance data are required"
      });
    }

    const attendanceDate = new Date(date);
    const schoolId = req.user.schoolId;

    // Validate all teacher IDs first
    const teacherIds = attendanceData.map(item => item.teacher);
    const validTeachers = await Teacher.find({
      _id: { $in: teacherIds },
      school: schoolId
    }).select('_id');

    const validTeacherIds = validTeachers.map(t => t._id.toString());
    const invalidTeachers = teacherIds.filter(id => 
      !validTeacherIds.includes(id.toString())
    );

    if (invalidTeachers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some teacher IDs are invalid or don't belong to your school",
        invalidTeachers
      });
    }

    // Prepare bulk operations
    const bulkOps = attendanceData.map(item => {
      const filter = {
        teacher: item.teacher,
        date: attendanceDate,
        school: schoolId
      };
      
      const update = {
        $set: {
          status: item.status,
          checkIn: item.checkIn || null,
          checkOut: item.checkOut || null,
          notes: item.notes || '',
          markedBy: req.user.id
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      };
      
      return {
        updateOne: {
          filter,
          update,
          upsert: true
        }
      };
    });

    // Execute bulk write
    const result = await TeacherAttendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount
      }
    });

  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get attendance for a specific date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const schoolId = req.user.schoolId;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    const attendanceDate = new Date(date);
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    const attendance = await TeacherAttendance.find({
      school: schoolId,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('teacher', 'name email teacher_image')
    .populate('markedBy', 'name')
    .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get attendance summary for a teacher
exports.getTeacherAttendanceSummary = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const schoolId = req.user.schoolId;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }

    // Verify teacher belongs to school
    const teacher = await Teacher.findOne({
      _id: teacherId,
      school: schoolId
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or not authorized"
      });
    }

    // Get current month's attendance
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const attendance = await TeacherAttendance.find({
      teacher: teacherId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: -1 });

    // Calculate summary
    const summary = {
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      late: attendance.filter(a => a.status === 'Late').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      onLeave: attendance.filter(a => a.status === 'On Leave').length,
      totalDays: attendance.length
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        attendance
      }
    });

  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get school-wide attendance summary
exports.getSchoolAttendanceSummary = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { month, year } = req.query;

    let startDate, endDate;
    
    if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month if no params
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get all teachers in school
    const teachers = await Teacher.find({ school: schoolId })
      .select('_id name teacher_image');

    // Get attendance for all teachers in date range
    const attendance = await TeacherAttendance.find({
      school: schoolId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate summary for each teacher
    const teacherSummaries = teachers.map(teacher => {
      const teacherAttendance = attendance.filter(a => 
        a.teacher.toString() === teacher._id.toString()
      );

      return {
        teacher: {
          _id: teacher._id,
          name: teacher.name,
          image: teacher.teacher_image
        },
        present: teacherAttendance.filter(a => a.status === 'Present').length,
        absent: teacherAttendance.filter(a => a.status === 'Absent').length,
        late: teacherAttendance.filter(a => a.status === 'Late').length,
        halfDay: teacherAttendance.filter(a => a.status === 'Half Day').length,
        onLeave: teacherAttendance.filter(a => a.status === 'On Leave').length,
        totalDays: teacherAttendance.length
      };
    });

    // Calculate overall summary
    const overallSummary = {
      present: teacherSummaries.reduce((sum, t) => sum + t.present, 0),
      absent: teacherSummaries.reduce((sum, t) => sum + t.absent, 0),
      late: teacherSummaries.reduce((sum, t) => sum + t.late, 0),
      halfDay: teacherSummaries.reduce((sum, t) => sum + t.halfDay, 0),
      onLeave: teacherSummaries.reduce((sum, t) => sum + t.onLeave, 0),
      totalDays: teacherSummaries.reduce((sum, t) => sum + t.totalDays, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        overallSummary,
        teacherSummaries
      }
    });

  } catch (error) {
    console.error("Error fetching school attendance summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch school attendance summary",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get attendance for a teacher in date range
exports.getTeacherAttendanceInRange = async (req, res) => {
  try {
    const { teacherId, startDate, endDate } = req.params;
    const schoolId = req.user.schoolId;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }

    // Validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD"
      });
    }

    // Verify teacher belongs to school
    const teacher = await Teacher.findOne({
      _id: teacherId,
      school: schoolId
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found or not authorized"
      });
    }

    // Get attendance in date range
    const attendance = await TeacherAttendance.find({
      teacher: teacherId,
      date: { $gte: parsedStartDate, $lte: parsedEndDate }
    }).sort({ date: -1 });

    // Calculate summary
    const summary = {
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      late: attendance.filter(a => a.status === 'Late').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      onLeave: attendance.filter(a => a.status === 'On Leave').length,
      totalDays: attendance.length
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        attendance
      }
    });

  } catch (error) {
    console.error("Error fetching attendance in range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};