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

// Get the class assigned to the teacher
exports.getTeacherClass = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.id).select('class').populate('class', 'class_text class_num');
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        res.status(200).json({ success: true, data: teacher.class });
    } catch (err) {
        console.error('Error getting teacher class:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get students for a specific class (teacher must be class teacher)
exports.getClassStudents = async (req, res) => {
    try {
        const { classId } = req.params;
        
        // Verify teacher is class teacher for this class
        const teacher = await Teacher.findOne({
            _id: req.user.id,
            class: classId,
            is_class_teacher: true
        });
        
        if (!teacher) {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized - You are not the class teacher for this class" 
            });
        }

        const students = await Student.find({ 
            student_class: classId,
            school: req.user.schoolId 
        }).select('name email student_image');

        res.status(200).json({ success: true, data: students });
    } catch (err) {
        console.error('Error getting class students:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Mark student attendance (by teacher)
exports.markStudentAttendanceByTeacher = async (req, res) => {
    try {
        const { attendances, date, classId } = req.body;

        // Validate input
        if (!date || !attendances?.length || !classId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date, class ID and attendance data are required.' 
            });
        }

        // Verify teacher is class teacher for this class
        const teacher = await Teacher.findOne({
            _id: req.user.id,
            class: classId,
            is_class_teacher: true
        });
        
        if (!teacher) {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized - You are not the class teacher for this class" 
            });
        }

        // Process attendance records
        for (const a of attendances) {
            if (!a.studentId || !a.status) continue;
            
            await StudentAttendance.updateOne(
                { student: a.studentId, date },
                {
                    $set: {
                        class: classId,
                        status: a.status,
                        markedBy: req.user.id // Track who marked the attendance
                    }
                },
                { upsert: true }
            );
        }

        res.status(200).json({ 
            success: true, 
            message: 'Student attendance marked successfully.' 
        })
    } catch (err) {
        console.error('Error marking student attendance:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get teacher's own attendance records
exports.getTeacherOwnAttendance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const query = { teacher: req.user.id };
        if (startDate && endDate) {
            query.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        const attendance = await TeacherAttendance.find(query)
            .sort({ date: -1 })
            .lean();

        res.status(200).json({ success: true, data: attendance });
    } catch (err) {
        console.error('Error fetching teacher attendance:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

//Add to your attendance controller
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    
    const query = { student: studentId };
    if (startDate && endDate) {
      query.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }

    const attendance = await StudentAttendance.find(query)
      .sort({ date: -1 });

    res.status(200).json({ 
      success: true, 
      data: attendance 
    });
  } catch (err) {
    console.error('Error fetching student attendance:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};