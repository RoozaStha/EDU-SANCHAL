const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const authMiddleware = require('../auth/auth');

// Student and Teacher routes
router.post('/', authMiddleware(['STUDENT', 'TEACHER']), leaveController.submitLeaveRequest);
router.get('/my', authMiddleware(['STUDENT', 'TEACHER']), leaveController.getMyLeaveRequests);
router.patch('/:id', authMiddleware(['STUDENT', 'TEACHER']), leaveController.updateLeaveRequest);
router.delete('/:id', authMiddleware(['STUDENT', 'TEACHER']), leaveController.deleteLeaveRequest);

// Teacher and School routes
router.get('/pending', authMiddleware(['TEACHER', 'SCHOOL']), leaveController.getPendingLeaveRequests);
router.patch('/:id/status', authMiddleware(['TEACHER', 'SCHOOL']), leaveController.updateLeaveStatus);

// Analytics routes (School only)
router.get('/analytics', authMiddleware(['SCHOOL']), leaveController.getLeaveAnalytics);
router.get('/calendar', authMiddleware(['SCHOOL', 'TEACHER']), leaveController.getLeaveCalendar);
router.get('/all', authMiddleware(['SCHOOL']), leaveController.getAllLeaveRequests);

module.exports = router;