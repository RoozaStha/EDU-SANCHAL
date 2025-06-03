const express = require('express');
const authMiddleware = require('../auth/auth')
const {
    registerSchool,
    getAllSchools,
    loginSchool,
    updateSchool,
    getSchoolOwnData
  } = require("../controllers/school.controller.js");
const authController = require('../controllers/authController');

const router = express.Router();


router.get('/validate-reset-token/:token', authController.validateResetToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
// Routes
router.post('/register', registerSchool);
router.get('/all', getAllSchools);
// Change from GET to POST
router.post('/login', loginSchool); 
router.patch('/update',authMiddleware(['SCHOOL']), updateSchool);

// Change the route to use authenticated user ID


router.get('/fetch-single', authMiddleware(['SCHOOL']), getSchoolOwnData);// Default export


module.exports = router;
