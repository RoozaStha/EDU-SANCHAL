const express = require('express');
const router = express.Router();
const auth = require('../auth/auth');
const controller = require('../controllers/attendance.controller');

// STUDENT ROUTES
router.post('/student/mark', auth(['SCHOOL']), controller.markStudentAttendance);
router.get('/student/summary/:classId', auth(['SCHOOL']), controller.getStudentAttendanceSummary);

// TEACHER ROUTES
router.post('/teacher/mark', auth(['SCHOOL']), controller.markTeacherAttendance);
router.get('/teacher/summary', auth(['SCHOOL']), controller.getTeacherAttendanceSummary);

// COMBINED
router.post('/all/mark', auth(['SCHOOL']), controller.markAllAttendance);

module.exports = router;
