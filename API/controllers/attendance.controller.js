const Attendance = require("../models/attendance.model");
const Student = require("../models/student.model");
const moment = require("moment");

const markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, classId } = req.body;

    if (!studentId || !date || !status || !classId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: studentId, date, status, and classId are required",
      });
    }

    const schoolId = req.user.schoolId;

    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: moment(date).startOf("day").toDate(),
      school: schoolId,
    });

    if (existingAttendance) {
      existingAttendance.status = status;
      await existingAttendance.save();
      return res.status(200).json({
        success: true,
        message: "Attendance updated successfully",
        data: existingAttendance,
      });
    }

    const newAttendance = new Attendance({
      student: studentId,
      date: moment(date).startOf("day").toDate(),
      status,
      class: classId,
      school: schoolId,
      markedBy: req.user.id,
    });

    await newAttendance.save();

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: newAttendance,
    });
  } catch (error) {
    console.error("Error in markAttendance:", error);
    res.status(500).json({
      success: false,
      message: "Error in marking attendance",
      error: error.message,
    });
  }
};

const markBulkAttendance = async (req, res) => {
  try {
    const { records } = req.body;
    const schoolId = req.user.schoolId;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid records array is required",
      });
    }

    const results = [];

    for (const record of records) {
      try {
        const { studentId, date, status, classId } = record;

        if (!studentId || !date || !status || !classId) {
          results.push({
            success: false,
            message: "Missing required fields for student",
            studentId: studentId || "unknown",
          });
          continue;
        }

        let parsedDate;
        try {
          parsedDate = new Date(date);
          if (isNaN(parsedDate.getTime())) {
            throw new Error("Invalid date format");
          }
        } catch (dateError) {
          results.push({
            success: false,
            message: "Invalid date format",
            studentId,
            error: dateError.message,
          });
          continue;
        }

        const existing = await Attendance.findOne({
          student: studentId,
          date: {
            $gte: moment(parsedDate).startOf("day").toDate(),
            $lt: moment(parsedDate).endOf("day").toDate(),
          },
          school: schoolId,
        });

        if (existing) {
          existing.status = status;
          await existing.save();
          results.push({
            success: true,
            message: "Attendance updated",
            data: existing,
            studentId,
          });
        } else {
          const newAttendance = new Attendance({
            student: studentId,
            date: moment(parsedDate).startOf("day").toDate(),
            status,
            class: classId,
            school: schoolId,
            markedBy: req.user.id,
          });

          await newAttendance.save();
          results.push({
            success: true,
            message: "Attendance created",
            data: newAttendance,
            studentId,
          });
        }
      } catch (recordError) {
        console.error("Error processing individual record:", recordError);
        results.push({
          success: false,
          message: "Error processing record",
          studentId: record?.studentId || "unknown",
          error: recordError.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.length - successCount;

    res.status(errorCount > 0 && successCount === 0 ? 500 : 200).json({
      success: successCount > 0,
      message: `Bulk attendance completed with ${successCount} successes and ${errorCount} errors`,
      count: results.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error("Error in markBulkAttendance:", error);
    res.status(500).json({
      success: false,
      message: "Error in marking bulk attendance",
      error: error.message,
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }
    const attendance = await Attendance.find({ student: studentId })
      .populate("student", "name student_class gender")
      .populate("markedBy", "name")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in getting attendance records",
      error: error.message,
    });
  }
};

const checkAttendance = async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;

  try {
    if (!classId) {
      return res.status(400).json({ success: false, message: "Class ID is required" });
    }

    const targetDate = date ? moment(date).startOf("day") : moment().startOf("day");

    const attendanceCount = await Attendance.countDocuments({
      class: classId,
      date: {
        $gte: targetDate.startOf("day").toDate(),
        $lt: targetDate.endOf("day").toDate(),
      },
    });

    res.status(200).json({
      success: true,
      attendanceTaken: attendanceCount > 0,
      count: attendanceCount,
      date: targetDate.format("YYYY-MM-DD"),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in checking attendance",
      error: error.message,
    });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    const totalAttendance = await Attendance.countDocuments({ student: studentId });
    const present = await Attendance.countDocuments({ student: studentId, status: "present" });
    const late = await Attendance.countDocuments({ student: studentId, status: "late" });
    const absent = await Attendance.countDocuments({ student: studentId, status: "absent" });

    const percentage = totalAttendance > 0 ? (present / totalAttendance) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalAttendance,
        present,
        late,
        absent,
        percentage: parseFloat(percentage.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error in stats", error: error.message });
  }
};

const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (!classId) {
      return res.status(400).json({ success: false, message: "Class ID is required" });
    }

    const targetDate = date ? moment(date).startOf("day") : moment().startOf("day");

    const students = await Student.find({ student_class: classId }).select(
      "_id name gender student_class guardian_phone"
    );

    const attendanceRecords = await Attendance.find({
      class: classId,
      date: {
        $gte: targetDate.startOf("day").toDate(),
        $lt: targetDate.endOf("day").toDate(),
      },
    })
      .populate("student", "name gender student_class")
      .populate("markedBy", "name");

    const response = students.map((student) => {
      const record = attendanceRecords.find(
        (r) => r.student._id.toString() === student._id.toString()
      );

      return {
        student: {
          _id: student._id,
          name: student.name,
          gender: student.gender,
          class: student.student_class,
          guardianPhone: student.guardian_phone,
        },
        status: record ? record.status : "not marked",
        markedBy: record ? record.markedBy : null,
        date: targetDate.format("YYYY-MM-DD"),
      };
    });

    res.status(200).json({
      success: true,
      date: targetDate.format("YYYY-MM-DD"),
      class: classId,
      count: response.length,
      data: response,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error", error: error.message });
  }
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  checkAttendance,
  getAttendanceStats,
  getClassAttendance,
};
