const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../auth/auth');

// Public routes
router.post('/register', authMiddleware(['SCHOOL']), studentController.registerStudent);
router.post('/login', studentController.loginStudent);

// Protected routes
router.get('/all', authMiddleware(['SCHOOL']), studentController.getStudentsWithQuery);
router.get('/fetch-single', authMiddleware(['STUDENT']), studentController.getStudentOwnData);
router.get('/:id', authMiddleware(['SCHOOL', 'ADMIN']), studentController.getStudentById);
router.patch('/update', authMiddleware(['STUDENT', 'SCHOOL']), studentController.updateStudent);
router.delete('/delete/:id', authMiddleware(['SCHOOL']), studentController.deleteStudentWithId);

// Additional route
router.get('/', authMiddleware(['SCHOOL', 'ADMIN']), studentController.getAllStudents);

module.exports = router;