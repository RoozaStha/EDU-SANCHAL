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



dotenv.config();

const app = express();

// 1. Enhanced CORS configuration

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('/images/uploaded/school', express.static(
  path.join(__dirname, '../frontend/public/images/uploaded/school'),
  { maxAge: '1d' }
));

// 2. Middleware ordering fix
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// 4. Improved MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// 5. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 6. API routes
app.use('/api/school', schoolRouter);
app.use("/api/class",classRouter);
app.use("/api/subjects", subjectRouter); 
app.use('/api/students', studentRouter);
app.use("/api/teachers",teacherRouter)
app.use("/api/schedule",scheduleRouter)


// 7. Enhanced error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});