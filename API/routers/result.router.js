const express = require('express');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const authMiddleware = require('../auth/auth');

// Teacher routes
router.post('/', 
  authMiddleware(['TEACHER','SCHOOL']), 
  resultController.createResult
);

router.get('/examination/:examinationId', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.getResultsByExamination
);

router.patch('/:id', 
  authMiddleware(['TEACHER','SCHOOL']), 
  resultController.updateResult
);

router.delete('/:id', 
  authMiddleware(['TEACHER', 'SCHOOL']), 
  resultController.deleteResult
);

// Student routes
router.get('/student', 
  authMiddleware(['STUDENT','SCHOOL','STUDENT']), 
  resultController.getResultsByStudent
);

router.get('/student/performance', 
  authMiddleware(['STUDENT','SCHOOL','STUDENT']), 
  resultController.getStudentPerformance
);

// School/teacher access to student results
router.get('/student/:studentId', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.getResultsByStudent
);

router.get('/student/:studentId/performance', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.getStudentPerformance
);

router.get('/analytics/:examinationId', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.getExaminationAnalytics
);

router.get('/export/pdf/:examinationId', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.exportResultsPDF
);

router.post('/student', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.createResultsForStudent
);

router.get('/subjects/:classId', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.getSubjectsByClass
);

router.get('/classes', 
  authMiddleware(['TEACHER', 'SCHOOL','STUDENT']), 
  resultController.getClassesForExamination
);

// NEW: Student performance analysis route
router.get(
  '/student-performance/:studentId',
  authMiddleware(['SCHOOL', 'TEACHER','STUDENT']),
  resultController.getDetailedStudentPerformance
);
// Add this new route above other routes
router.get('/student-performance', 
  authMiddleware(['STUDENT','SCHOOL']), 
  resultController.getStudentPerformance
);

// NEW: Class performance comparison route
router.get(
  '/class-performance/:classId',
  authMiddleware(['SCHOOL','STUDENT','TEACHER']),
  resultController.getClassPerformanceComparison
);
// Add this new route for student's own performance:
router.get('/student/my-performance', 
  authMiddleware(['STUDENT','SCHOOL']),
  resultController.getMyPerformance
)

// Add this new route for student performance
router.get(
  '/student/my-detailed-performance',
  authMiddleware(['STUDENT']),
  resultController.getMyDetailedPerformance
);

module.exports = router;