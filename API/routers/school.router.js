const express = require('express');
const authMiddleware = require('../auth/auth')
const {
    registerSchool,
    getAllSchools,
    loginSchool,
    updateSchool,
    getSchoolOwnData
  } = require("../controllers/school.controller.js");
  
const router = express.Router();

// Routes
router.post('/register', registerSchool);
router.get('/all', getAllSchools);
// Change from GET to POST
router.post('/login', loginSchool); 
router.patch('/update',authMiddleware(['SCHOOL']), updateSchool);
// Change the route to use authenticated user ID
router.get('/fetch-single', authMiddleware(['SCHOOL']), getSchoolOwnData);// Default export
module.exports = router;
