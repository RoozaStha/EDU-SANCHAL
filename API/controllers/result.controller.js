const mongoose = require('mongoose');
const Result = require('../models/result.model');
const Student = require('../models/student.model');
const Examination = require('../models/examination.model');
const Subject = require('../models/subject.model');
const Class = require('../models/class.model');
// Make sure to import Class model
const PDFDocument = require('pdfkit');

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

    // Check permissions - UPDATED TO ALLOW SCHOOL ADMINS
    if (req.user.role !== 'TEACHER' && req.user.role !== 'SCHOOL') {
      return res.status(403).json({
        success: false,
        message: "Only teachers and school admins can create results"
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

    const examination = await Examination.findById(examinationId);
    if (!examination) {
      return res.status(404).json({
        success: false,
        message: "Examination not found"
      });
    }

    // Verify student is in examination's class
    const student = await Student.findById(studentId);
    if (student.student_class.toString() !== examination.class.toString()) {
      return res.status(400).json({
        success: false,
        message: "Student is not in the examination class"
      });
    }

    // Verify subject belongs to examination
    if (examination.subject.toString() !== subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject does not belong to this examination"
      });
    }
   const publishedByModel = req.user.role === 'TEACHER' ? 'Teacher' : 'School';


    // Create new result
    const newResult = new Result({
      school: req.user.schoolId,
      examination: examinationId,
      student: studentId,
      subject: subjectId,
      marks,
      maxMarks,
      remarks,
      publishedBy: req.user.id,
      publishedByModel 
    });

    const savedResult = await newResult.save();

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
      if (!result.examination || !result.subject) return acc;

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
exports.createResultsForStudent = async (req, res) => {
  try {
    const { examinationId, studentId, results } = req.body;

    if (!examinationId || !studentId || !results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdResults = [];

      for (const result of results) {
        // Validate each result
        if (!result.subjectId || result.marks === undefined || !result.maxMarks) {
          throw new Error("Missing required fields in result data");
        }

        const newResult = new Result({
          school: req.user.schoolId,
          examination: examinationId,
          student: studentId,
          subject: result.subjectId,
          marks: result.marks,
          maxMarks: result.maxMarks,
          publishedBy: req.user.id,
          publishedByModel: req.user.role === 'TEACHER' ? 'Teacher' : 'School' // Add this

        });

        const savedResult = await newResult.save({ session });
        createdResults.push(savedResult);
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        message: "Results created successfully",
        data: createdResults
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Bulk create error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create results",
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};

exports.getExaminationAnalytics = async (req, res) => {
  try {
    const examinationId = req.params.examinationId;
    const { passThreshold = 50 } = req.query; // Changed default threshold to 50 to match frontend

    if (!mongoose.Types.ObjectId.isValid(examinationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid examination ID"
      });
    }

    const examination = await Examination.findById(examinationId);
    if (!examination || examination.school.toString() !== req.user.schoolId) {
      return res.status(404).json({
        success: false,
        message: "Examination not found"
      });
    }

    const results = await Result.find({ examination: examinationId })
      .populate('student', 'name')
      .populate('subject', 'subject_name')
      .lean();

    // Group by student
    const studentResults = {};
    results.forEach(result => {
      if (!result.student || !result.subject) return;

      const studentId = result.student._id.toString();
      if (!studentResults[studentId]) {
        studentResults[studentId] = {
          student: result.student,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0,
          passedSubjects: 0,
          totalSubjects: 0
        };
      }

      studentResults[studentId].subjects.push({
        subject: result.subject,
        marks: result.marks,
        maxMarks: result.maxMarks,
        percentage: result.percentage
      });

      studentResults[studentId].totalMarks += result.marks;
      studentResults[studentId].totalMaxMarks += result.maxMarks;
      studentResults[studentId].totalSubjects++;
      if (result.percentage >= passThreshold) {
        studentResults[studentId].passedSubjects++;
      }
    });

    // Calculate overall percentages and status
    const studentAnalytics = Object.values(studentResults).map(student => {
      const overallPercentage = parseFloat(
        ((student.totalMarks / student.totalMaxMarks) * 100).toFixed(2)
      );

      // Student passes only if all subjects are passed
      const status = student.passedSubjects === student.totalSubjects ? 'Pass' : 'Fail';

      return {
        ...student,
        overallPercentage,
        status
      };
    });

    // Calculate pass/fail counts
    const passCount = studentAnalytics.filter(s => s.status === 'Pass').length;
    const failCount = studentAnalytics.length - passCount;

    res.status(200).json({
      success: true,
      message: "Analytics fetched successfully",
      data: {
        totalStudents: studentAnalytics.length,
        passCount,
        failCount,
        passPercentage: parseFloat(((passCount / studentAnalytics.length) * 100).toFixed(2)),
        studentAnalytics
      }
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.exportResultsPDF = async (req, res) => {
  try {
    const examinationId = req.params.examinationId;

    const examination = await Examination.findById(examinationId)
      .populate('school', 'schoolName')
      .lean();

    if (!examination) {
      return res.status(404).json({
        success: false,
        message: "Examination not found"
      });
    }

    const results = await Result.find({ examination: examinationId })
      .populate('student', 'name rollNumber')
      .populate('subject', 'subject_name')
      .populate('publishedBy', 'name')
      .lean();

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "No results found for this examination"
      });
    }

    const doc = new PDFDocument();
    const filename = `results_${examinationId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).text(`${examination.school.schoolName} - Results`, { align: 'center' });
    doc.fontSize(14).text(`Examination: ${examination.examType} - ${new Date(examination.examDate).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Group results by student
    const studentResults = {};
    results.forEach(result => {
      if (!result.student || !result.subject) return;

      const studentId = result.student._id.toString();
      if (!studentResults[studentId]) {
        studentResults[studentId] = {
          student: result.student,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0
        };
      }

      studentResults[studentId].subjects.push({
        subject: result.subject,
        marks: result.marks,
        maxMarks: result.maxMarks,
        percentage: result.percentage
      });

      studentResults[studentId].totalMarks += result.marks;
      studentResults[studentId].totalMaxMarks += result.maxMarks;
    });

    // Student-wise results
    Object.values(studentResults).forEach((student, index) => {
      if (index > 0) doc.addPage();

      const studentName = student.student ? student.student.name : 'Unknown Student';
      const rollNumber = student.student ? (student.student.rollNumber || 'N/A') : 'N/A';

      doc.fontSize(16).text(`Student: ${studentName} (Roll: ${rollNumber})`);
      doc.moveDown();

      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Subject', 50, doc.y);
      doc.text('Marks', 250, doc.y);
      doc.text('Percentage', 350, doc.y);
      doc.moveDown();
      doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      // Subjects
      doc.font('Helvetica');
      student.subjects.forEach(subject => {
        const subjectName = subject.subject ? subject.subject.subject_name : 'Unknown Subject';
        doc.text(subjectName, 50, doc.y);
        doc.text(`${subject.marks}/${subject.maxMarks}`, 250, doc.y);
        doc.text(`${subject.percentage}%`, 350, doc.y);
        doc.moveDown();
      });

      // Summary
      const overallPercentage = (student.totalMarks / student.totalMaxMarks * 100).toFixed(2);
      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Total Marks: ${student.totalMarks}/${student.totalMaxMarks}`, 50, doc.y);
      doc.text(`Overall Percentage: ${overallPercentage}%`, 250, doc.y);
      doc.moveDown();
      doc.text(`Result: ${overallPercentage >= 40 ? 'PASS' : 'FAIL'}`, 50, doc.y);
    });

    doc.end();
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export results",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// Add this new controller function
// Add to result.controller.js
exports.getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID"
      });
    }

    // Get class to get school ID
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Get all subjects for the school
    const subjects = await Subject.find({
      school: classObj.school
    }).select('subject_name subject_codename');

    res.status(200).json({
      success: true,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add to result.controller.js
exports.getClassesForExamination = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const classes = await Class.find({ school: schoolId })
      .select('class_text class_num')
      .lean();

    res.status(200).json({
      success: true,
      data: classes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Fix getMyPerformance function
exports.getMyPerformance = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student and verify school
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get all results for the student
    const results = await Result.find({ student: studentId })
      .populate('examination', 'examType examDate')
      .populate('subject', 'subject_name')
      .lean();

    // Calculate overall performance
    const performance = results.reduce((acc, result) => {
      if (!result.examination || !result.subject) return acc;

      const examType = result.examination.examType;

      if (!acc[examType]) {
        acc[examType] = {
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          subjects: []
        };
      }

      acc[examType].totalMarks += result.marks;
      acc[examType].totalMaxMarks += result.maxMarks;
      acc[examType].count++;
      acc[examType].subjects.push({
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
      data: performance
    });

  } catch (error) {
    console.error("Get my performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get performance data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// NEW: Get detailed student performance analysis
exports.getDetailedStudentPerformance = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    // Get student and verify school
    const student = await Student.findById(studentId);
    if (!student || student.school.toString() !== req.user.schoolId) {
      return res.status(404).json({
        success: false,
        message: "Student not found or unauthorized"
      });
    }

    // Get all results for the student
    const results = await Result.find({ student: studentId })
      .populate('examination', 'examType examDate class')
      .populate('subject', 'subject_name')
      .lean();

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "No results found for this student"
      });
    }

    // Organize by examination
    const performanceByExam = {};
    results.forEach(result => {
      if (!result.examination || !result.subject) return;

      const examId = result.examination._id.toString();

      if (!performanceByExam[examId]) {
        performanceByExam[examId] = {
          examType: result.examination.examType,
          examDate: result.examination.examDate,
          class: result.examination.class,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0
        };
      }

      performanceByExam[examId].subjects.push({
        subject: result.subject.subject_name,
        marks: result.marks,
        maxMarks: result.maxMarks,
        percentage: result.percentage
      });

      performanceByExam[examId].totalMarks += result.marks;
      performanceByExam[examId].totalMaxMarks += result.maxMarks;
    });

    // Calculate overall percentages
    Object.keys(performanceByExam).forEach(examId => {
      const exam = performanceByExam[examId];
      exam.overallPercentage = parseFloat(
        ((exam.totalMarks / exam.totalMaxMarks) * 100).toFixed(2)
      );
    });

    // Calculate trends and improvements
    const exams = Object.values(performanceByExam).sort((a, b) =>
      new Date(a.examDate) - new Date(b.examDate)
    );

    const subjectTrends = {};
    exams.forEach(exam => {
      exam.subjects.forEach(subject => {
        if (!subjectTrends[subject.subject]) {
          subjectTrends[subject.subject] = [];
        }
        subjectTrends[subject.subject].push({
          examType: exam.examType,
          examDate: exam.examDate,
          percentage: subject.percentage
        });
      });
    });

    // Calculate overall improvement
    let improvement = null;
    if (exams.length > 1) {
      const firstExam = exams[0];
      const lastExam = exams[exams.length - 1];
      improvement = {
        from: firstExam.overallPercentage,
        to: lastExam.overallPercentage,
        change: parseFloat((lastExam.overallPercentage - firstExam.overallPercentage).toFixed(2))
      };
    }

    res.status(200).json({
      success: true,
      message: "Student performance analysis fetched",
      data: {
        student: {
          name: student.name,
          class: student.student_class
        },
        exams: performanceByExam,
        subjectTrends,
        improvement,
        examCount: exams.length
      }
    });
  } catch (error) {
    console.error("Detailed student performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student performance analysis",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// NEW: Get class-wise performance comparison
exports.getClassPerformanceComparison = async (req, res) => {
  try {
    const { classId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID"
      });
    }

    // Get class and verify school
    const classObj = await Class.findById(classId);
    if (!classObj || classObj.school.toString() !== req.user.schoolId) {
      return res.status(404).json({
        success: false,
        message: "Class not found or unauthorized"
      });
    }

    // Get all students in the class
    const students = await Student.find({ student_class: classId });
    const studentIds = students.map(s => s._id);

    // Get all results for these students
    const results = await Result.find({ student: { $in: studentIds } })
      .populate('examination', 'examType examDate')
      .populate('subject', 'subject_name')
      .populate('student', 'name')
      .lean();

    // Organize by student
    const studentPerformance = {};
    results.forEach(result => {
      if (!result.examination || !result.subject || !result.student) return;

      const studentId = result.student._id.toString();

      if (!studentPerformance[studentId]) {
        studentPerformance[studentId] = {
          student: result.student,
          exams: {},
          totalMarks: 0,
          totalMaxMarks: 0,
          subjectCount: 0
        };
      }

      const examId = result.examination._id.toString();
      if (!studentPerformance[studentId].exams[examId]) {
        studentPerformance[studentId].exams[examId] = {
          examType: result.examination.examType,
          examDate: result.examination.examDate,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0
        };
      }

      studentPerformance[studentId].exams[examId].subjects.push({
        subject: result.subject.subject_name,
        marks: result.marks,
        maxMarks: result.maxMarks,
        percentage: result.percentage
      });

      studentPerformance[studentId].exams[examId].totalMarks += result.marks;
      studentPerformance[studentId].exams[examId].totalMaxMarks += result.maxMarks;

      // Add to overall student totals
      studentPerformance[studentId].totalMarks += result.marks;
      studentPerformance[studentId].totalMaxMarks += result.maxMarks;
      studentPerformance[studentId].subjectCount++;
    });

    // Calculate overall percentages
    Object.keys(studentPerformance).forEach(studentId => {
      const student = studentPerformance[studentId];
      student.overallPercentage = parseFloat(
        ((student.totalMarks / student.totalMaxMarks) * 100).toFixed(2)
      );

      // Calculate exam percentages
      Object.keys(student.exams).forEach(examId => {
        const exam = student.exams[examId];
        exam.overallPercentage = parseFloat(
          ((exam.totalMarks / exam.totalMaxMarks) * 100).toFixed(2)
        );
      });
    });

    // Convert to array and sort by performance
    const classPerformance = Object.values(studentPerformance).sort(
      (a, b) => b.overallPercentage - a.overallPercentage
    );

    // Calculate class average
    const totalPercentage = classPerformance.reduce(
      (sum, student) => sum + student.overallPercentage, 0
    );
    const classAverage = parseFloat(
      (totalPercentage / classPerformance.length).toFixed(2)
    );

    res.status(200).json({
      success: true,
      message: "Class performance comparison fetched",
      data: {
        className: classObj.class_text,
        students: classPerformance,
        studentCount: classPerformance.length,
        classAverage
      }
    });
  } catch (error) {
    console.error("Class performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get class performance",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fix getMyDetailedPerformance
exports.getMyDetailedPerformance = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student and verify school
    const student = await Student.findById(studentId).populate('student_class');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get all results for the student
    const results = await Result.find({ student: studentId })
      .populate('examination', 'examType examDate class')
      .populate('subject', 'subject_name')
      .lean();

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "No results found for this student"
      });
    }

    // Organize by examination
    const exams = {};
    const subjectPerformance = {};

    results.forEach(result => {
      if (!result.examination || !result.subject) return;

      const examId = result.examination._id.toString();

      if (!exams[examId]) {
        exams[examId] = {
          examType: result.examination.examType,
          examDate: result.examination.examDate,
          class: result.examination.class,
          subjects: [],
          totalMarks: 0,
          totalMaxMarks: 0
        };
      }

      exams[examId].subjects.push({
        subject: result.subject.subject_name,
        marks: result.marks,
        maxMarks: result.maxMarks,
        percentage: result.percentage
      });

      exams[examId].totalMarks += result.marks;
      exams[examId].totalMaxMarks += result.maxMarks;

      // Track subject performance
      const subjectName = result.subject.subject_name;
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          totalMarks: 0,
          totalMaxMarks: 0,
          count: 0,
          exams: []
        };
      }

      subjectPerformance[subjectName].totalMarks += result.marks;
      subjectPerformance[subjectName].totalMaxMarks += result.maxMarks;
      subjectPerformance[subjectName].count++;
      subjectPerformance[subjectName].exams.push({
        examType: result.examination.examType,
        examDate: result.examination.examDate,
        percentage: result.percentage
      });
    });

    // Calculate overall percentages
    Object.keys(exams).forEach(examId => {
      exams[examId].overallPercentage =
        (exams[examId].totalMarks / exams[examId].totalMaxMarks) * 100;
    });

    // Calculate subject averages
    const subjectTrends = {};
    Object.keys(subjectPerformance).forEach(subject => {
      const subj = subjectPerformance[subject];
      subjectTrends[subject] = {
        averagePercentage: (subj.totalMarks / subj.totalMaxMarks) * 100,
        exams: subj.exams
      };
    });

    res.status(200).json({
      success: true,
      data: {
        student: {
          name: student.name,
          class: student.student_class?.class_text || "N/A"
        },
        exams,
        subjectTrends,
        examCount: Object.keys(exams).length
      }
    });
  } catch (error) {
    console.error("Detailed student performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student performance analysis",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};