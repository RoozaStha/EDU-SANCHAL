const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  markBulkAttendance,
  getClassAttendance,
  getStudentAttendanceStats,
  getClassAttendanceSummary,
} = require("../controllers/attendance.controller");

// Mark attendance for multiple students
router.post(
  "/bulk",
  authMiddleware(["TEACHER", "SCHOOL"]),
  markBulkAttendance
);

// Get attendance for a class on a specific date
router.get(
  "/class/:classId",
  authMiddleware(["TEACHER", "SCHOOL"]),
  getClassAttendance
);

// Get attendance statistics for a student
router.get(
  "/stats/:studentId",
  authMiddleware(["TEACHER", "SCHOOL"]),
  getStudentAttendanceStats
);

// Get attendance summary for a class
router.get(
  "/summary/:classId",
  authMiddleware(["TEACHER", "SCHOOL"]),
  getClassAttendanceSummary
);

module.exports = router;