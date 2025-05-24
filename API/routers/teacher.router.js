const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const authMiddleware = require('../auth/auth');

// Public routes
router.post('/register', authMiddleware(['SCHOOL']), teacherController.registerTeacher);
router.post('/login', teacherController.loginTeacher);

// Protected routes
router.get('/all', authMiddleware(['SCHOOL']), teacherController.getAllTeachers);
router.get('/fetch-single', authMiddleware(['TEACHER','SCHOOL']), teacherController.getTeacherOwnData);
router.get('/class-teacher/:classId', authMiddleware(['SCHOOL', 'TEACHER']), teacherController.getClassTeacher);
router.get('/:id', authMiddleware(['SCHOOL', 'ADMIN']), teacherController.getTeacherById);
router.patch('/update', authMiddleware(['TEACHER', 'SCHOOL']), teacherController.updateTeacher);
router.delete('/delete/:id', authMiddleware(['SCHOOL']), teacherController.deleteTeacherWithId);

module.exports = router;