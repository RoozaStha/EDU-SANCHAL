const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const authMiddleware = require('../auth/auth');

// Public routes
router.post('/register', authMiddleware(['SCHOOL']), teacherController.registerTeacher);
router.post('/login', teacherController.loginTeacher);

// Protected routes
router.get('/all', authMiddleware(['SCHOOL']), teacherController.getTeachersWithQuery);
router.get('/fetch-single', authMiddleware(['TEACHER']), teacherController.getTeacherOwnData);
router.get('/:id', authMiddleware(['SCHOOL', 'ADMIN']), teacherController.getTeacherById);
router.patch('/update', authMiddleware(['TEACHER', 'SCHOOL']), teacherController.updateTeacher);
router.delete('/delete/:id', authMiddleware(['SCHOOL']), teacherController.deleteTeacherWithId);

// Additional route
router.get('/', authMiddleware(['SCHOOL', 'ADMIN']), teacherController.getAllTeachers);

module.exports = router;