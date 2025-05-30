const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../auth/auth');

router.post('/student/mark', authMiddleware(['SCHOOL']), attendanceController.markStudentAttendance);
router.post('/teacher/mark', authMiddleware(['SCHOOL']), attendanceController.markTeacherAttendance);
router.get('/student/summary/:classId', authMiddleware(['SCHOOL']), attendanceController.getStudentAttendanceSummary);
router.get('/teacher/summary', authMiddleware(['SCHOOL']), attendanceController.getTeacherAttendanceSummary);
// In attendance.routes.js
router.post('/all/mark', authMiddleware(['SCHOOL']), attendanceController.markAllAttendance);
module.exports = router;
