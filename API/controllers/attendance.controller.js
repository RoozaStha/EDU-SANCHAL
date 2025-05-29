const StudentAttendance = require('../models/studentAttendance.model');
const TeacherAttendance = require('../models/teacherAttendance.model');

exports.markStudentAttendance = async (req, res) => {
  try {
    const { attendances, date } = req.body; // [{ studentId, status, classId }]
    const attendanceRecords = attendances.map(a => ({
      student: a.studentId,
      class: a.classId,
      status: a.status,
      date,
    }));
    await StudentAttendance.insertMany(attendanceRecords, { ordered: false });
    res.status(200).json({ success: true, message: "Attendance recorded." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to record student attendance.", error: err.message });
  }
};

exports.markTeacherAttendance = async (req, res) => {
  try {
    const { attendances, date } = req.body; // [{ teacherId, status }]
    const attendanceRecords = attendances.map(a => ({
      teacher: a.teacherId,
      status: a.status,
      date,
    }));
    await TeacherAttendance.insertMany(attendanceRecords, { ordered: false });
    res.status(200).json({ success: true, message: "Teacher attendance recorded." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to record teacher attendance.", error: err.message });
  }
};

exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const summary = await StudentAttendance.find({ class: classId }).populate('student', 'name');
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch student summary." });
  }
};

exports.getTeacherAttendanceSummary = async (req, res) => {
  try {
    const summary = await TeacherAttendance.find().populate('teacher', 'name');
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch teacher summary." });
  }
};
