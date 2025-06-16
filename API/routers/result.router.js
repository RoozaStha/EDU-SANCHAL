const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const authMiddleware = require('../auth/auth');

// Teacher routes
router.post('/', 
  authMiddleware(['TEACHER']), 
  resultController.createResult
);

router.get('/examination/:examinationId', 
  authMiddleware(['TEACHER', 'SCHOOL']), 
  resultController.getResultsByExamination
);

router.patch('/:id', 
  authMiddleware(['TEACHER']), 
  resultController.updateResult
);

router.delete('/:id', 
  authMiddleware(['TEACHER', 'SCHOOL']), 
  resultController.deleteResult
);

// Student routes
router.get('/student', 
  authMiddleware(['STUDENT']), 
  resultController.getResultsByStudent
);

router.get('/student/performance', 
  authMiddleware(['STUDENT']), 
  resultController.getStudentPerformance
);

// School/teacher access to student results
router.get('/student/:studentId', 
  authMiddleware(['TEACHER', 'SCHOOL']), 
  resultController.getResultsByStudent
);

router.get('/student/:studentId/performance', 
  authMiddleware(['TEACHER', 'SCHOOL']), 
  resultController.getStudentPerformance
);

module.exports = router;