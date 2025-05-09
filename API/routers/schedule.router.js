const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const authMiddleware = require("../auth/auth");

// Define allowed roles for schedule management
const allowedRoles = ['SCHOOL', 'TEACHER']; // Adjust as needed

// Create a new schedule
router.post('/', authMiddleware(allowedRoles), scheduleController.createSchedule);

// Update a schedule
router.put('/:id', authMiddleware(allowedRoles), scheduleController.updateSchedule);

// Delete a schedule
router.delete('/:id', authMiddleware(allowedRoles), scheduleController.deleteSchedule);

// Get schedules by class ID
router.get('/fetch-with-class/:classId', authMiddleware(['SCHOOL', 'TEACHER', 'STUDENT']), scheduleController.getSchedulesByClass);

// Get a single schedule by ID
router.get('/:id', authMiddleware(['SCHOOL', 'TEACHER', 'STUDENT']), scheduleController.getScheduleById);

module.exports = router;