// routers/teacherAttendance.router.js
const express = require('express');
const router = express.Router();
const teacherAttendanceController = require('../controllers/teacherAttendance.controller');
const authMiddleware = require('../auth/auth');

// Teacher-specific attendance routes
router.get('/classes', authMiddleware(['TEACHER']), teacherAttendanceController.getTeacherClasses);
router.get('/students', authMiddleware(['TEACHER','SCHOOL']), teacherAttendanceController.getClassStudents);
router.post('/mark', authMiddleware(['TEACHER']), teacherAttendanceController.markClassAttendance);
router.get('/summary', authMiddleware(['TEACHER']), teacherAttendanceController.getClassAttendanceSummary);
router.get('/records', authMiddleware(['TEACHER']), teacherAttendanceController.getTeacherOwnAttendance);

module.exports = router;