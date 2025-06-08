const Assignment = require('../models/assignment.model');
const AssignmentSubmission = require('../models/submission.model');

// TEACHER creates an assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, subject, class: classId, dueDate, attachments } = req.body;

    const assignment = new Assignment({
      title,
      description,
      subject,
      class: classId,
      dueDate,
      attachments,
      school: req.user.schoolId,
      teacher: req.user.id
    });

    await assignment.save();

    res.status(201).json({ success: true, message: "Assignment created", data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating assignment", error: error.message });
  }
};

// STUDENT fetches assignments for their class
exports.getAssignmentsForStudent = async (req, res) => {
  try {
    const { classId } = req.query;

    const assignments = await Assignment.find({ class: classId, school: req.user.schoolId })
      .populate('subject', 'subject_name')
      .populate('teacher', 'name');

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching assignments", error: error.message });
  }
};

// STUDENT submits an assignment
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, fileUrl, remarks } = req.body;

    const submission = new AssignmentSubmission({
      assignment: assignmentId,
      student: req.user.id,
      fileUrl,
      remarks
    });

    await submission.save();

    res.status(201).json({ success: true, message: "Assignment submitted", data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error submitting assignment", error: error.message });
  }
};

// TEACHER gets all submissions for an assignment
exports.getSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'name email image_url');

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching submissions", error: error.message });
  }
};
