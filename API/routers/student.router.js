const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../auth/auth');
const authController = require('../controllers/authController');


// Public routes
router.post('/register', authMiddleware(['SCHOOL']), studentController.registerStudent);
router.post('/login', studentController.loginStudent);
router.get('/validate-reset-token/:token', authController.validateResetToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
// Protected routes
router.get('/all', authMiddleware(['SCHOOL','TEACHER']), studentController.getStudentsWithQuery);
router.get('/fetch-single', authMiddleware(['STUDENT','SCHOOL','TEACHER']), studentController.getStudentOwnData);
router.get('/:id', authMiddleware(['SCHOOL','TEACHER']), studentController.getStudentById);
router.patch('/update', authMiddleware(['STUDENT', 'SCHOOL']), studentController.updateStudent);
router.delete('/delete/:id', authMiddleware(['SCHOOL']), studentController.deleteStudentWithId);

// Additional route
router.get('/', authMiddleware(['SCHOOL','TEACHER','STUDENT']), studentController.getAllStudents);


module.exports = router;