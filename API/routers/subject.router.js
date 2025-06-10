const express = require("express");
const router = express.Router();
const { 
  createSubject,
  getAllSubjects,
  updateSubjectWithId,
  deleteSubjectWithId
} = require("../controllers/subject.controller");
const authMiddleware = require('../auth/auth')

// Apply auth middleware to all subject routes
router.use(authMiddleware());
router.post("/",authMiddleware(['STUDENT','SCHOOL','TEACHER']),  createSubject);
router.get("/", getAllSubjects);
router.patch("/:id",authMiddleware(['STUDENT','SCHOOL','TEACHER']),  updateSubjectWithId);
router.delete("/:id",authMiddleware(['STUDENT','SCHOOL','TEACHER']),  deleteSubjectWithId);

module.exports = router;