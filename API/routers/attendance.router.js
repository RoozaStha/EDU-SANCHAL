const express = require('express');
const router = express.Router();
const auth = require('../auth/auth');
const controller = require('../controllers/attendance.controller');

// STUDENT ROUTES
router.post('/student/mark', auth(['SCHOOL','TEACHER']), controller.markStudentAttendance);
router.get('/student/summary/:classId', auth(['SCHOOL','TEACHER']), controller.getStudentAttendanceSummary);

// TEACHER ROUTES
router.post('/teacher/mark', auth(['SCHOOL','TEACHER']), controller.markTeacherAttendance);
router.get('/teacher/summary', auth(['SCHOOL','TEACHER']), controller.getTeacherAttendanceSummary);

// COMBINED
router.post('/all/mark', auth(['SCHOOL','TEACHER']), controller.markAllAttendance);


// Add these routes to the existing attendance router
router.get('/teacher/class', auth(['TEACHER','SCHOOL']), controller.getTeacherClass);
router.get('/teacher/class-students/:classId', auth(['TEACHER','SCHOOL']), controller.getClassStudents);
router.post('/teacher/mark-students', auth(['TEACHER','SCHOOL']), controller.markStudentAttendanceByTeacher);
router.get('/teacher/my-attendance', auth(['TEACHER','SCHOOL']), controller.getTeacherOwnAttendance);

router.get('/student/summary', auth(['STUDENT']), controller.getStudentAttendance);

module.exports = router;
