const Result = require('../models/result.model');
const Student = require('../models/student.model');
const Examination = require('../models/examination.model');
const Subject = require('../models/subject.model');
const mongoose = require('mongoose');

exports.createResult = async (req, res) => {
  try {
    const { examinationId, studentId, subjectId, marks, maxMarks, remarks } = req.body;
    
    // Validate input
    if (!examinationId || !studentId || !subjectId || marks === undefined || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Check permissions (only teachers can create results)
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: "Only teachers can create results"
      });
    }

    // Validate object IDs
    const validIds = [examinationId, studentId, subjectId].every(id => 
      mongoose.Types.ObjectId.isValid(id)
    );
    
    if (!validIds) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }

    // Create new result
    const newResult = new Result({
      school: req.user.schoolId,
      examination: examinationId,
      student: studentId,
      subject: subjectId,
      marks,
      maxMarks,
      remarks,
      publishedBy: req.user.id
    });

    const savedResult = await newResult.save();

    // Populate the saved result
    const populatedResult = await Result.findById(savedResult._id)
      .populate('student', 'name')
      .populate('subject', 'subject_name')
      .lean();
    
    res.status(201).json({
      success: true,
      message: "Result created successfully",
      data: savedResult
    });
  } catch (error) {
    console.error("Create result error:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Result already exists for this student and subject"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to create result",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getResultsByStudent = async (req, res) => {
  try {
    let studentId;
    
    // Determine student ID based on role
    if (req.user.role === 'STUDENT') {
      studentId = req.user.id;
    } else if (req.params.studentId) {
      studentId = req.params.studentId;
    } else {
      return res.status(400).json({
        success: false,
        message: "Student ID required"
      });
    }

    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format"
      });
    }

    // Authorization check
    if (req.user.role !== 'STUDENT') {
      const student = await Student.findById(studentId);
      if (!student || student.school.toString() !== req.user.schoolId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to student results"
        });
      }
    }

    // Get results with populated data
    const results = await Result.find({ student: studentId })
      .populate('examination', 'examType examDate')
      .populate('subject', 'subject_name')
      .populate('publishedBy', 'name')
      .lean();

    res.status(200).json({
      success: true,
      message: "Results fetched successfully",
      data: results
    });
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getResultsByExamination = async (req, res) => {
  try {
    const examinationId = req.params.examinationId;
    
    // Validate examination ID
    if (!mongoose.Types.ObjectId.isValid(examinationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examination ID format"
      });
    }

    // Get examination to verify school
    const examination = await Examination.findById(examinationId);
    if (!examination || examination.school.toString() !== req.user.schoolId) {
      return res.status(404).json({
        success: false,
        message: "Examination not found or unauthorized"
      });
    }

    // Get results with populated student data
    const results = await Result.find({ examination: examinationId })
      .populate('student', 'name email student_class')
      .populate('subject', 'subject_name')
      .populate('publishedBy', 'name')
      .lean();

    res.status(200).json({
      success: true,
      message: "Results fetched successfully",
      data: results
    });
  } catch (error) {
    console.error("Get examination results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch results",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const resultId = req.params.id;
    const { marks, maxMarks, remarks } = req.body;
    
    // Validate input
    if (!resultId || marks === undefined || !maxMarks) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate result ID
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID format"
      });
    }

    // Find and update result
    const updatedResult = await Result.findOneAndUpdate(
      {
        _id: resultId,
        school: req.user.schoolId
      },
      { marks, maxMarks, remarks },
      { new: true, runValidators: true }
    ).populate('subject', 'subject_name');

    if (!updatedResult) {
      return res.status(404).json({
        success: false,
        message: "Result not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: updatedResult
    });
  } catch (error) {
    console.error("Update result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update result",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    const resultId = req.params.id;
    
    // Validate result ID
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID format"
      });
    }

    // Delete result
    const deletedResult = await Result.findOneAndDelete({
      _id: resultId,
      school: req.user.schoolId
    });

    if (!deletedResult) {
      return res.status(404).json({
        success: false,
        message: "Result not found or unauthorized"
      });
    }

    res.status(200).json({
      success: true,
      message: "Result deleted successfully"
    });
  } catch (error) {
    console.error("Delete result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete result",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get student's overall performance
exports.getStudentPerformance = async (req, res) => {
  try {
    let studentId;
    
    if (req.user.role === 'STUDENT') {
      studentId = req.user.id;
    } else if (req.params.studentId) {
      studentId = req.params.studentId;
    } else {
      return res.status(400).json({
        success: false,
        message: "Student ID required"
      });
    }

    // Get all results for the student
    const results = await Result.find({ student: studentId })
      .populate('examination', 'examType examDate')
      .populate('subject', 'subject_name')
      .lean();

    // Calculate overall performance
    const performance = results.reduce((acc, result) => {
      if (!acc[result.examination.examType]) {
        acc[result.examination.examType] = {
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          subjects: []
        };
      }
      
      acc[result.examination.examType].totalMarks += result.marks;
      acc[result.examination.examType].totalMaxMarks += result.maxMarks;
      acc[result.examination.examType].count++;
      acc[result.examination.examType].subjects.push({
        subject: result.subject.subject_name,
        marks: result.marks,
        maxMarks: result.maxMarks,
        percentage: result.percentage,
        examDate: result.examination.examDate
      });
      
      return acc;
    }, {});

    // Calculate overall percentages
    Object.keys(performance).forEach(examType => {
      performance[examType].overallPercentage = 
        (performance[examType].totalMarks / performance[examType].totalMaxMarks) * 100;
    });

    res.status(200).json({
      success: true,
      message: "Student performance fetched",
      data: performance
    });
  } catch (error) {
    console.error("Get student performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student performance",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};