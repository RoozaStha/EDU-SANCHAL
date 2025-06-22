// routers/chatbot.router.js
const express = require('express');
const router = express.Router();

const knowledgeBase = {
  // Authentication & Account Management
  "how to reset password": "Use 'Forgot Password' on login page. You'll receive a reset link via email. Or contact your school admin for assistance.",
  "update profile": "Go to your profile page > 'Edit Profile'. You can update contact info, profile photo, and preferences.",
  "change profile picture": "In profile settings, click your image > 'Upload New'. Supported formats: JPG, PNG (max 5MB).",

  // Student Features
  "view attendance": "Students: Check 'My Attendance' in dashboard. Teachers: Go to 'Attendance' > Select class > View records.",
  "check schedule": "View your timetable in 'Schedule' section. Filter by day/week. Class teachers can edit schedules.",
  "exam results": "Results are in 'Examinations' > 'Results'. Students see their grades, teachers can enter marks.",
  "school notices": "All notices appear in 'Announcements' on your dashboard. Teachers can post new notices.",

  // Teacher Features
  "mark attendance": "Teachers: Go to 'Attendance' > Select class/date > Mark present/absent > Submit. Must be class teacher.",
  "enter grades": "In 'Examinations' > 'Enter Marks'. Select exam, class, subject. Only subject teachers can enter grades.",
  "assign class teacher": "Admins: Edit teacher profile > Enable 'Is Class Teacher'. Only one per class allowed.",
  "post notice": "Teachers: 'Announcements' > 'Create' > Select audience (class/school) > Publish.",
  "generate report card": "After entering marks, go to 'Examinations' > 'Generate Reports'. System auto-creates report cards.",

  // Admin Features
  "add student": "Admins: 'Student Management' > 'Add New'. Provide name, email, class, guardian info. Password auto-generated.",
  "register teacher": "Admins: 'Staff Management' > 'Add Teacher'. Set qualifications, subjects, and class assignment.",
  "create exam": "Admins: 'Examinations' > 'Create Exam'. Set dates, subjects, and grading criteria.",
  "delete student": "Admins: Find student in 'Student Management' > Click delete. Associated data and image will be removed.",
  "manage classes": "Admins: 'Academic Settings' > 'Classes'. Create classes and assign class teachers.",

  // System Features
  "supported image formats": "Profile images support JPG, PNG. Max size 5MB. Automatic resizing applied.",
  "data privacy": "All data is encrypted. Only school admins have full access. Students/teachers see only their data.",
  "contact support": "Submit ticket in 'Help Desk' or call school office. Emergency contact: [YOUR_SCHOOL_PHONE]",

  // Greetings & Fallbacks
  "hi": "Hello! How can I assist with school management today?",
  "hello": "Hi there! Ask me about attendance, schedules, exams, or user management.",
  "thank": "You're welcome! Let me know if you need further assistance.",
  "default": "I'm still learning! Try asking about: attendance, schedules, exam results, or user management."
};

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    
    // Normalize input
    const normalizedInput = message.toLowerCase().trim()
      .replace(/[^\w\s]/gi, '')
      .replace(/\b(?:how to|can i|where|when|what|my|me|please)\b/gi, '')
      .trim();

    // Match priority: 1) Exact match 2) Partial match 3) Default
    let response = knowledgeBase[normalizedInput];
    
    if (!response) {
      const knowledgeKeys = Object.keys(knowledgeBase);
      const matchKey = knowledgeKeys.find(k => normalizedInput.includes(k));
      response = matchKey ? knowledgeBase[matchKey] : knowledgeBase["default"];
    }

    // Add role-specific suggestions (if user info is available)
    if (req.user?.role) {
      const role = req.user.role.toLowerCase();
      if (response === knowledgeBase["default"]) {
        if (role === "student") {
          response += " Students can ask about: attendance, schedules, or results.";
        } else if (role === "teacher") {
          response += " Teachers can ask about: marking attendance, entering grades, or posting notices.";
        }
      }
    }

    res.json({ response });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ 
      success: false,
      message: "Chatbot processing failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Critical export - must be the router instance
module.exports = router;