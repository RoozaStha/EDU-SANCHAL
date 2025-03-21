const express = require('express');
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
router.get('/login', loginSchool);
router.patch('/update', updateSchool);
router.get('/fetch-single', getSchoolOwnData);

// Default export
module.exports = router;
