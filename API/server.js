const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const schoolRouter = require('./routers/school.router.js');
const classRouter = require("./routers/class.router.js");
const subjectRouter = require("./routers/subject.router.js")
const studentRouter = require('./routers/student.router.js');
const teacherRouter = require('./routers/teacher.router.js');
const scheduleRouter = require('./routers/schedule.router.js')
const attendanceRouter = require('./routers/attendance.router.js');
const examinationRouter = require("./routers/examination.router.js");
const noticeRouter = require("./routers/notice.router.js");
const teacherAttendanceRouter = require("./routers/teacherAttendance.router.js")
const chatbotRoutes = require("./routers/chatbot.router.js");
const assignmentRoutes = require('./routers/assignment.router.js');
const resultRouter = require('./routers/result.router.js');
const leaveRouter = require('./routers/leave.router.js')
const emailVerificationController = require('./controllers/emailVerification.controller');
const authRouter = require('./routers/auth.router'); // Add this line
dotenv.config();

const app = express();

// 1. Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Authorization'] 
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/images/uploaded/school', express.static(
  path.join(__dirname, '../frontend/public/images/uploaded/school'),
  { maxAge: '1d' }
));

// 2. Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 3. MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// 4. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 5. API routes
app.use('/api/school', schoolRouter);
app.use("/api/class",classRouter);
app.use("/api/subjects", subjectRouter); 
app.use('/api/students', studentRouter);
app.use("/api/teachers",teacherRouter)
app.use("/api/schedule",scheduleRouter);
app.use("/api/attendance",attendanceRouter);
app.use("/api/examination",examinationRouter);
app.use("/api/notice",noticeRouter);
app.use("/api/teacherAttendance",teacherAttendanceRouter);
app.use("/api/chatbot", chatbotRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/results', resultRouter);
app.use('/api/leaves',leaveRouter);
app.use('/api', authRouter); // Add this line


// 6. Enhanced error handling
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error:`, err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
    timestamp
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${mongoose.connection.host}/${mongoose.connection.name}`);
});