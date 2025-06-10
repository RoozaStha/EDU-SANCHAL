const { Assignment, AssignmentSubmission } = require('../models/assignment.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

ffmpeg.setFfmpegPath(ffmpegPath);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.fieldname.includes('video') ? 'videos' : 'assignments';
    const uploadDir = `uploads/${type}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi|mkv|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Only documents, images, and videos are allowed!');
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
}).fields([
  { name: 'attachments', maxCount: 5 },
  { name: 'submission', maxCount: 1 },
  { name: 'feedbackVideo', maxCount: 1 },
  { name: 'assignmentVideo', maxCount: 1 }
]);

// Helper to handle file uploads
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err });
    }
    next();
  });
};

// Compress video helper
const compressVideo = async (filePath) => {
  const tempPath = filePath + '.compressed.mp4';
  
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions([
        '-c:v libx264',
        '-crf 28',
        '-preset medium',
        '-c:a aac',
        '-b:a 64k'
      ])
      .on('end', () => resolve(tempPath))
      .on('error', (err) => reject(err))
      .save(tempPath);
  });
};

// TEACHER creates an assignment
exports.createAssignment = [handleUpload, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      subject, 
      class: classId, 
      dueDate, 
      videoUrl, 
      rubric,
      maxPoints,
      allowLateSubmission,
      peerReviewEnabled
    } = req.body;

    // Handle file uploads
    const attachments = [];
    if (req.files && req.files['attachments']) {
      req.files['attachments'].forEach(file => {
        attachments.push(`/uploads/assignments/${file.filename}`);
      });
    }

    // Handle video upload
    let assignmentVideoUrl = videoUrl;
    if (req.files && req.files['assignmentVideo']) {
      const file = req.files['assignmentVideo'][0];
      assignmentVideoUrl = `/uploads/videos/${file.filename}`;
      
      // Compress video in background
      compressVideo(file.path)
        .then(compressedPath => {
          fs.rename(compressedPath, file.path, (err) => {
            if (err) console.error('Error replacing video:', err);
          });
        })
        .catch(err => console.error('Compression error:', err));
    }

    const assignment = new Assignment({
      title,
      description,
      subject,
      class: classId,
      dueDate,
      attachments,
      videoUrl: assignmentVideoUrl,
      rubric: rubric ? JSON.parse(rubric) : [],
      maxPoints,
      allowLateSubmission,
      peerReviewEnabled,
      school: req.user.schoolId,
      teacher: req.user.id
    });

    await assignment.save();

    res.status(201).json({ 
      success: true, 
      message: "Assignment created", 
      data: assignment 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error creating assignment", 
      error: error.message 
    });
  }
}];

// Get single assignment
exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('subject', 'subject_name')
      .populate('class', 'class_text')
      .populate('teacher', 'name email');

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: assignment 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching assignment", 
      error: error.message 
    });
  }
};

// Update assignment
exports.updateAssignment = [handleUpload, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      subject, 
      class: classId, 
      dueDate, 
      videoUrl, 
      rubric,
      maxPoints,
      allowLateSubmission,
      peerReviewEnabled
    } = req.body;
    
    // Handle file uploads
    const attachments = [];
    if (req.files && req.files['attachments']) {
      req.files['attachments'].forEach(file => {
        attachments.push(`/uploads/assignments/${file.filename}`);
      });
    }

    // Handle video upload
    let assignmentVideoUrl = videoUrl;
    if (req.files && req.files['assignmentVideo']) {
      const file = req.files['assignmentVideo'][0];
      assignmentVideoUrl = `/uploads/videos/${file.filename}`;
      
      // Compress video in background
      compressVideo(file.path)
        .then(compressedPath => {
          fs.rename(compressedPath, file.path, (err) => {
            if (err) console.error('Error replacing video:', err);
          });
        })
        .catch(err => console.error('Compression error:', err));
    }

    const updateData = {
      title,
      description,
      subject,
      class: classId,
      dueDate,
      videoUrl: assignmentVideoUrl,
      rubric: rubric ? JSON.parse(rubric) : [],
      maxPoints,
      allowLateSubmission,
      peerReviewEnabled,
      $push: { attachments: { $each: attachments } }
    };

    // Remove null fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Assignment updated", 
      data: assignment 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error updating assignment", 
      error: error.message 
    });
  }
}];

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({ 
        success: false, 
        message: "Assignment not found" 
      });
    }

    // Delete associated files
    const deletePromises = [];
    
    if (assignment.attachments && assignment.attachments.length > 0) {
      assignment.attachments.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          deletePromises.push(unlinkAsync(filePath));
        }
      });
    }
    
    if (assignment.videoUrl) {
      const videoPath = path.join(__dirname, '..', assignment.videoUrl);
      if (fs.existsSync(videoPath)) {
        deletePromises.push(unlinkAsync(videoPath));
      }
    }

    await Promise.all(deletePromises);

    // Delete associated submissions
    await AssignmentSubmission.deleteMany({ assignment: req.params.id });

    res.status(200).json({ 
      success: true, 
      message: "Assignment deleted successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error deleting assignment", 
      error: error.message 
    });
  }
};

// STUDENT fetches assignments for their class - Updated version
exports.getAssignmentsForStudent = async (req, res) => {
  try {
    // Get student's class from their profile
    const student = await Student.findById(req.user.id).select('class');
    if (!student || !student.class) {
      return res.status(400).json({ 
        success: false, 
        message: "Student class information not found" 
      });
    }

    const assignments = await Assignment.find({ 
      class: student.class,
      school: req.user.schoolId 
    })
      .populate('subject', 'subject_name')
      .populate('teacher', 'name')
      .populate('class', 'class_text')
      .sort({ dueDate: 1 });

    res.status(200).json({ 
      success: true, 
      data: assignments 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching assignments", 
      error: error.message 
    });
  }
};

// STUDENT submits an assignment
exports.submitAssignment = [handleUpload, async (req, res) => {
  try {
    const { assignmentId, remarks, videoUrl } = req.body;
    
    let fileUrl = '';
    let submissionVideoUrl = videoUrl;
    
    if (req.files && req.files['submission']) {
      fileUrl = `/uploads/assignments/${req.files['submission'][0].filename}`;
    }
    
    if (req.files && req.files['submissionVideo']) {
      const file = req.files['submissionVideo'][0];
      submissionVideoUrl = `/uploads/videos/${file.filename}`;
      
      // Compress video in background
      compressVideo(file.path)
        .then(compressedPath => {
          fs.rename(compressedPath, file.path, (err) => {
            if (err) console.error('Error replacing video:', err);
          });
        })
        .catch(err => console.error('Compression error:', err));
    }

    // Check if submission is late
    const assignment = await Assignment.findById(assignmentId);
    const isLate = assignment && new Date() > assignment.dueDate;
    
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({
        success: false,
        message: "Late submissions not allowed for this assignment"
      });
    }

    const submission = new AssignmentSubmission({
      assignment: assignmentId,
      student: req.user.id,
      fileUrl,
      videoUrl: submissionVideoUrl,
      remarks,
      lateSubmission: isLate
    });

    await submission.save();

    res.status(201).json({ 
      success: true, 
      message: "Assignment submitted", 
      data: submission 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error submitting assignment", 
      error: error.message 
    });
  }
}];

// TEACHER gets all submissions for an assignment
exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'name email image_url')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: submissions 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching submissions", 
      error: error.message 
    });
  }
};

// TEACHER grades a submission
exports.gradeSubmission = [handleUpload, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, rubricScores } = req.body;
    
    let feedbackVideoUrl = '';
    if (req.files && req.files['feedbackVideo']) {
      const file = req.files['feedbackVideo'][0];
      feedbackVideoUrl = `/uploads/videos/${file.filename}`;
      
      // Compress video in background
      compressVideo(file.path)
        .then(compressedPath => {
          fs.rename(compressedPath, file.path, (err) => {
            if (err) console.error('Error replacing video:', err);
          });
        })
        .catch(err => console.error('Compression error:', err));
    }

    const updateData = {
      grade,
      feedback,
      feedbackVideoUrl,
      gradedAt: new Date(),
      rubricScores: rubricScores ? JSON.parse(rubricScores) : []
    };

    // Remove null fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      updateData,
      { new: true }
    ).populate('student', 'name email');

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "Submission not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Grade submitted", 
      data: submission 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error grading submission", 
      error: error.message 
    });
  }
}];

// Grant extension to a student
exports.grantExtension = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { extensionDate } = req.body;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      { extensionGranted: new Date(extensionDate) },
      { new: true }
    ).populate('student', 'name email');

    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: "Submission not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Extension granted", 
      data: submission 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error granting extension", 
      error: error.message 
    });
  }
};

// TEACHER fetches assignments they created
exports.getAssignmentsForTeacher = async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      teacher: req.user.id, 
      school: req.user.schoolId 
    })
      .populate('subject', 'subject_name')
      .populate('class', 'class_text')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: assignments 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching teacher assignments", 
      error: error.message 
    });
  }
};

// Get assignment analytics
exports.getAssignmentAnalytics = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId
    });
    
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined).length;
    const lateSubmissions = submissions.filter(s => s.lateSubmission).length;
    
    const grades = submissions
      .filter(s => s.grade !== undefined)
      .map(s => s.grade);
    
    const averageGrade = grades.length > 0 
      ? grades.reduce((a, b) => a + b, 0) / grades.length 
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        gradedSubmissions,
        lateSubmissions,
        averageGrade,
        gradeDistribution: grades
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching analytics", 
      error: error.message 
    });
  }
};