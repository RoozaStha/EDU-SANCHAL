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
router.use(authMiddleware(['SCHOOL']));

router.post("/", createSubject);
router.get("/", getAllSubjects);
router.patch("/:id", updateSubjectWithId);
router.delete("/:id", deleteSubjectWithId);

module.exports = router;