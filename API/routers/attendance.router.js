const express = require("express");
const authMiddleware = require('../auth/auth');
const {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  checkAttendance,
  getAttendanceStats,
  getClassAttendance
} = require("../controllers/attendance.controller");

const router = express.Router();

/**
 * @route POST /api/attendance/mark
 * @desc Mark attendance for a single student
 * @access Private (Teachers only)
 */
router.post("/mark", authMiddleware(['TEACHER', 'SCHOOL']), markAttendance);

/**
 * @route POST /api/attendance/mark/bulk
 * @desc Mark attendance for multiple students
 * @access Private (Teachers only)
 */
router.post("/mark/bulk", authMiddleware(['TEACHER', 'SCHOOL']), markBulkAttendance);

/**
 * @route GET /api/attendance/:studentId
 * @desc Get attendance records for a specific student
 * @access Private (School admins and teachers)
 */
router.get("/:studentId", authMiddleware(['SCHOOL', 'TEACHER']), getAttendance);

/**
 * @route GET /api/attendance/check/:class_num
 * @desc Check if attendance has been taken for a class on a date
 * @access Private (School admins and teachers)
 */
router.get("/check/:class_num", authMiddleware(['SCHOOL', 'TEACHER']), checkAttendance);

/**
 * @route GET /api/attendance/stats/:studentId
 * @desc Get attendance statistics for a student
 * @access Private (School admins and teachers)
 */
router.get("/stats/:studentId", authMiddleware(['SCHOOL', 'TEACHER']), getAttendanceStats);

/**
 * @route GET /api/attendance/class/:class_num
 * @desc Get class attendance for a specific date
 * @access Private (School admins and teachers)
 */
router.get("/class/:class_num", authMiddleware(['SCHOOL', 'TEACHER']), getClassAttendance);

module.exports = router;

