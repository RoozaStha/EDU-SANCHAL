const StudentAttendance = require('../models/studentAttendance.model');
const TeacherAttendance = require('../models/teacherAttendance.model');
const Student = require('../models/student.model');
const Teacher = require('../models/teacher.model');

// MARK: Student attendance
exports.markStudentAttendance = async (req, res) => {
  try {
    const { attendances, date } = req.body;

    if (!date || !attendances?.length) {
      return res.status(400).json({ success: false, message: 'Date and student attendance are required.' });
    }

    for (const a of attendances) {
      if (!a.studentId || !a.classId || !a.status) continue;
      await StudentAttendance.updateOne(
        { student: a.studentId, date },
        {
          $set: {
            class: a.classId,
            status: a.status
          }
        },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, message: 'Student attendance marked successfully.' });
  } catch (err) {
    console.error('Error marking student attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// MARK: Teacher attendance
exports.markTeacherAttendance = async (req, res) => {
  try {
    const { attendances, date } = req.body;

    if (!date || !attendances?.length) {
      return res.status(400).json({ success: false, message: 'Date and teacher attendance are required.' });
    }

    for (const a of attendances) {
      if (!a.teacherId || !a.status) continue;
      await TeacherAttendance.updateOne(
        { teacher: a.teacherId, date },
        {
          $set: {
            status: a.status
          }
        },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, message: 'Teacher attendance marked successfully.' });
  } catch (err) {
    console.error('Error marking teacher attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// MARK: Combined submission (students + teachers)
exports.markAllAttendance = async (req, res) => {
  try {
    const { studentAttendances, teacherAttendances, date } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    // Process student attendances
    if (studentAttendances?.length) {
      for (const a of studentAttendances) {
        if (!a.studentId || !a.classId || !a.status) continue;
        await StudentAttendance.updateOne(
          { student: a.studentId, date },
          {
            $set: {
              class: a.classId,
              status: a.status
            }
          },
          { upsert: true }
        );
      }
    }

    // Process teacher attendances
    if (teacherAttendances?.length) {
      for (const a of teacherAttendances) {
        if (!a.teacherId || !a.status) continue;
        await TeacherAttendance.updateOne(
          { teacher: a.teacherId, date },
          {
            $set: {
              status: a.status
            }
          },
          { upsert: true }
        );
      }
    }

    res.status(200).json({ success: true, message: 'All attendance marked successfully.' });
  } catch (err) {
    console.error('Error marking all attendance:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET: Student summary
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { class: classId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const summary = await StudentAttendance.find(query).populate('student', 'name email');
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error('Error fetching student summary:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET: Teacher summary
exports.getTeacherAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const summary = await TeacherAttendance.find(query).populate('teacher', 'name email');
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error('Error fetching teacher summary:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
