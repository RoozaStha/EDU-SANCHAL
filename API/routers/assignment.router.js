const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const auth = require('../auth/auth');

// Serve static files
router.use('/uploads', express.static('uploads'));

// Create a new assignment (TEACHER only)
router.post(
  '/',
  auth(['TEACHER']),
  assignmentController.createAssignment
);

// Get single assignment
router.get(
  '/:id',
  auth(['TEACHER', 'STUDENT']),
  assignmentController.getAssignment
);

// Update assignment (TEACHER only)
router.put(
  '/:id',
  auth(['TEACHER']),
  assignmentController.updateAssignment
);

// Delete assignment (TEACHER only)
router.delete(
  '/:id',
  auth(['TEACHER']),
  assignmentController.deleteAssignment
);

// Get assignments for student (STUDENT only)
router.get(
  '/student/list',
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
  auth(['TEACHER','STUDENT']),
  assignmentController.getSubmissionsForAssignment
);

// NEW: Get submissions for student (STUDENT only)
router.get(
  '/submissions/student/list',
  auth(['STUDENT']),
  assignmentController.getSubmissionsForStudent
);

// Grade a submission (TEACHER only)
router.post(
  '/submissions/:submissionId/grade',
  auth(['TEACHER']),
  assignmentController.gradeSubmission
);

// Grant extension to a student (TEACHER only)
router.post(
  '/submissions/:submissionId/extension',
  auth(['TEACHER']),
  assignmentController.grantExtension
);

// Get teacher's assignments (TEACHER only)
router.get(
  '/teacher/list',
  auth(['TEACHER']),
  assignmentController.getAssignmentsForTeacher
);

// Get assignment analytics (TEACHER only)
router.get(
  '/analytics/:assignmentId',
  auth(['TEACHER']),
  assignmentController.getAssignmentAnalytics
);

module.exports = router;