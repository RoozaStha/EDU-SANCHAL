const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const auth = require('../auth/auth');

// Create a new assignment (TEACHER only)
router.post(
  '/create',
  auth(['TEACHER']),
  assignmentController.createAssignment
);

// Get assignments for student (STUDENT only)
router.get(
  '/student',
  auth(['STUDENT']),
  assignmentController.getAssignmentsForStudent
);

// Student submits an assignment (STUDENT only)
router.post(
  '/submit',
  auth(['STUDENT']),
  assignmentController.submitAssignment
);

// Get submissions for an assignment (TEACHER only)
router.get(
  '/submissions/:assignmentId',
  auth(['TEACHER']),
  assignmentController.getSubmissionsForAssignment
);

module.exports = router;
