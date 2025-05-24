const Attendance = require("../models/attendance.model");
const Student = require("../models/student.model");
const Teacher = require("../models/teacher.model");
const Class = require("../models/class.model");
const moment = require("moment");

// Helper function to validate date
const validateDate = (date) => {
  const parsedDate = moment(date, "YYYY-MM-DD", true);
  if (!parsedDate.isValid()) {
    throw new Error("Invalid date format. Please use YYYY-MM-DD");
  }
  return parsedDate.startOf("day").toDate();
};

// Mark attendance for multiple students
exports.markBulkAttendance = async (req, res) => {
  try {
    const { date, classId, records } = req.body;
    const schoolId = req.user.schoolId;

    if (!date || !classId || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Date, classId, and records array are required",
      });
    }

    const targetDate = validateDate(date);

    // Verify class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if teacher is class teacher (if not school admin)
    if (req.user.role === "TEACHER") {
      const isClassTeacher = await Teacher.findOne({
        _id: req.user.id,
        class: classId,
        is_class_teacher: true,
        school: schoolId,
      });

      if (!isClassTeacher) {
        return res.status(403).json({
          success: false,
          message: "Only class teacher can mark attendance for this class",
        });
      }
    }

    const results = [];
    const bulkOps = [];

    for (const record of records) {
      const { studentId, status, remarks } = record;

      if (!studentId || !status) {
        results.push({
          studentId,
          success: false,
          message: "Student ID and status are required",
        });
        continue;
      }

      // Check if student exists and belongs to the class
      const student = await Student.findOne({
        _id: studentId,
        student_class: classId,
        school: schoolId,
      }).select('name gender guardian_phone student_image student_class');

      if (!student) {
        results.push({
          studentId,
          success: false,
          message: "Student not found in this class",
        });
        continue;
      }

      // Prepare bulk operation
      bulkOps.push({
        updateOne: {
          filter: {
            student: studentId,
            date: targetDate,
            school: schoolId,
          },
          update: {
            $set: {
              status,
              remarks: remarks || "",
              class: classId,
              markedBy: req.user.id,
            },
          },
          upsert: true,
        },
      });

      results.push({
        studentId,
        success: true,
        message: "Attendance marked",
      });
    }

    // Execute bulk operation
    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      date: moment(targetDate).format("YYYY-MM-DD"),
      class: classId,
      results,
    });
  } catch (error) {
    console.error("Error in markBulkAttendance:", error);
    res.status(500).json({
      success: false,
      message: "Error marking attendance",
      error: error.message,
    });
  }
};

// Get attendance for a class on a specific date
exports.getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;
    const schoolId = req.user.schoolId;

    // Debugging logs
    console.log('Request received with:', { classId, date, schoolId });

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // Validate and parse date
    const targetDate = date ? validateDate(date) : moment().startOf("day").toDate();
    console.log('Using date:', targetDate);

    // Verify class exists
    const classDetails = await Class.findById(classId).select("class_text");
    if (!classDetails) {
      console.log('Class not found with ID:', classId);
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }
    console.log('Found class:', classDetails.class_text);

    // Get class teacher
    const classTeacher = await Teacher.findOne({
      class: classId,
      is_class_teacher: true,
      school: schoolId,
    }).select("name email teacher_image");
    console.log('Class teacher:', classTeacher);

    // Debug: Check Student schema paths
    const studentSchemaPaths = Student.schema.paths;
    console.log('Student schema paths:', Object.keys(studentSchemaPaths));

    // Get all students in class (temporarily removing filters for debugging)
    const studentsQuery = {
      $or: [
        { student_class: classId },  // Try both possible field names
        { class: classId }
      ],
      school: schoolId,
      // status: "active"  // Temporarily removed for debugging
    };
    console.log('Students query:', JSON.stringify(studentsQuery));

    const students = await Student.find(studentsQuery)
      .select("name gender student_class class guardian_phone student_image status")
      .lean();  // Convert to plain JS objects for debugging

    console.log(`Found ${students.length} students`);
    if (students.length > 0) {
      console.log('Sample student:', students[0]);
    }

    // If no students found with student_class, try with class field
    if (students.length === 0) {
      console.log('Trying alternative query with "class" field only');
      const altStudents = await Student.find({
        class: classId,
        school: schoolId
      }).select("name gender class guardian_phone student_image status");

      console.log(`Found ${altStudents.length} students with alternative query`);
      if (altStudents.length > 0) {
        students = altStudents;
      }
    }

    // Get attendance records for the date
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: targetDate,
      school: schoolId,
    })
      .populate("student", "name gender guardian_phone student_image")
      .populate("markedBy", "name teacher_image")
      .populate("class", "class_text");;

    console.log(`Found ${attendanceRecords.length} attendance records`);

    // Combine student data with attendance status
    const attendanceData = students.map((student) => {
      const record = attendanceRecords.find((r) =>
        r.student && r.student._id.equals(student._id)
        );

      return {
        student: {
          _id: student._id,
          name: student.name,
          gender: student.gender,
          class: record?.class?.class_text || student.student_class?.class_text || student.class?.class_text || 'N/A', guardianPhone: student.guardian_phone,
          image: student.student_image,
          status: student.status  // Include student status in response
        },
        status: record ? record.status : null,
        remarks: record ? record.remarks : null,
        markedBy: record ? record.markedBy : null,
        markedAt: record ? record.createdAt : null,
      };
    });

    res.status(200).json({
      success: true,
      date: moment(targetDate).format("YYYY-MM-DD"),
      class: classId,
      className: classDetails.class_text,
      classTeacher,
      attendanceTaken: attendanceRecords.length > 0,
      count: attendanceData.length,
      data: attendanceData,
      debug: {  // Include debug info in development
        studentSchemaPaths: Object.keys(studentSchemaPaths),
        queryUsed: studentsQuery,
        rawStudentsCount: students.length,
        rawAttendanceCount: attendanceRecords.length
      }
    });
  } catch (error) {
    console.error("Error in getClassAttendance:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



// Get attendance statistics for a student
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user.schoolId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Get student info
    const student = await Student.findOne({
      _id: studentId,
      school: schoolId,
    }).select("name student_class");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get all attendance records for the student
    const allRecords = await Attendance.find({
      student: studentId,
      school: schoolId,
    }).sort({ date: -1 });

    // Calculate statistics
    const totalRecords = allRecords.length;
    const presentCount = allRecords.filter(
      (r) => r.status === "present"
    ).length;
    const lateCount = allRecords.filter((r) => r.status === "late").length;
    const absentCount = allRecords.filter((r) => r.status === "absent").length;
    const halfDayCount = allRecords.filter(
      (r) => r.status === "half_day"
    ).length;
    const excusedCount = allRecords.filter(
      (r) => r.status === "excused"
    ).length;

    const attendancePercentage =
      totalRecords > 0
        ? ((presentCount + lateCount * 0.75 + halfDayCount * 0.5) /
          totalRecords) *
        100
        : 0;

    // Get recent attendance (last 10 records)
    const recentAttendance = allRecords.slice(0, 10).map((record) => ({
      date: record.date,
      status: record.status,
      remarks: record.remarks,
      markedBy: record.markedBy,
    }));

    res.status(200).json({
      success: true,
      student: {
        name: student.name,
        class: student.student_class,
      },
      stats: {
        total: totalRecords,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        halfDay: halfDayCount,
        excused: excusedCount,
        percentage: parseFloat(attendancePercentage.toFixed(2)),
      },
      recentAttendance,
    });
  } catch (error) {
    console.error("Error in getStudentAttendanceStats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance statistics",
      error: error.message,
    });
  }
};

// Get attendance summary for a class
exports.getClassAttendanceSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    const { fromDate, toDate } = req.query;
    const schoolId = req.user.schoolId;

    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // Get class details
    const classDetails = await Class.findById(classId).select("class_text");
    if (!classDetails) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Validate dates
    const startDate = fromDate
      ? validateDate(fromDate)
      : moment().startOf("month").toDate();
    const endDate = toDate
      ? validateDate(toDate)
      : moment().endOf("day").toDate();

    // Get all students in the class with names
    const students = await Student.find({
      student_class: classId,
      school: schoolId,
    }).select("_id name");

    // Get all attendance records for the class in date range
    const attendanceRecords = await Attendance.find({
      class: classId,
      date: { $gte: startDate, $lte: endDate },
      school: schoolId,
    });

    // Get total school days in the period (excluding weekends)
    let schoolDays = 0;
    let currentDate = moment(startDate);
    while (currentDate.isSameOrBefore(endDate)) {
      if (currentDate.day() !== 0 && currentDate.day() !== 6) { // Skip weekends
        schoolDays++;
      }
      currentDate.add(1, 'day');
    }

    // Create summary for each student
    const summary = students.map((student) => {
      const studentRecords = attendanceRecords.filter((r) =>
        r.student.equals(student._id)
      );

      const presentCount = studentRecords.filter(
        (r) => r.status === "present"
      ).length;
      const lateCount = studentRecords.filter(
        (r) => r.status === "late"
      ).length;
      const halfDayCount = studentRecords.filter(
        (r) => r.status === "half_day"
      ).length;
      const totalCount = studentRecords.length;

      // Calculate weighted attendance
      const weightedAttendance = presentCount + (lateCount * 0.75) + (halfDayCount * 0.5);
      const attendancePercentage = schoolDays > 0
        ? (weightedAttendance / schoolDays) * 100
        : 0;

      return {
        studentId: student._id,
        studentName: student.name,
        totalDays: schoolDays,
        presentDays: presentCount,
        lateDays: lateCount,
        halfDays: halfDayCount,
        absentDays: schoolDays - totalCount,
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
      };
    });

    // Calculate class average
    const classAverage = summary.length > 0
      ? summary.reduce((sum, student) => sum + student.attendancePercentage, 0) / summary.length
      : 0;

    res.status(200).json({
      success: true,
      classId,
      className: classDetails.class_text,
      dateRange: {
        from: moment(startDate).format("YYYY-MM-DD"),
        to: moment(endDate).format("YYYY-MM-DD"),
      },
      totalStudents: students.length,
      totalSchoolDays: schoolDays,
      classAverage: parseFloat(classAverage.toFixed(2)),
      summary,
    });
  } catch (error) {
    console.error("Error in getClassAttendanceSummary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching attendance summary",
      error: error.message,
    });
  }
};