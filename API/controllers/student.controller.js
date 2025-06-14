require("dotenv").config();
const formidable = require("formidable");
const Student = require("../models/student.model");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

// Helper function for file upload
const handleFileUpload = (files, uploadPath, fieldName) => {
    if (!files?.[fieldName]) {
        throw new Error(`${fieldName} is required`);
    }

    const photo = files[fieldName][0];
    const sanitizedFilename = `${Date.now()}-${photo.originalFilename
        .replace(/ /g, "_")
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .toLowerCase()}`;

    const newPath = path.join(uploadPath, sanitizedFilename);
    fs.renameSync(photo.filepath, newPath);

    return sanitizedFilename;
};

// Register a new student
exports.registerStudent = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            try {
                // Validate input fields
                const requiredFields = ['name', 'email', 'student_class', 'age', 'gender', 'guardian', 'guardian_phone', 'password'];
                const missingFields = requiredFields.filter(field => !fields[field]);

                if (missingFields.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    });
                }

                // Process credentials
                const email = fields.email[0].trim().toLowerCase();
                const rawPassword = fields.password[0].trim();

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid email format"
                    });
                }

                if (rawPassword.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: "Password must be at least 8 characters"
                    });
                }

                // Check existing student
                const existingStudent = await Student.findOne({
                    email: { $regex: new RegExp(`^${email}$`, "i") }
                });

                if (existingStudent) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already registered"
                    });
                }
                // In registerStudent and updateStudent
                if (fields.student_class) {
                    if (!mongoose.Types.ObjectId.isValid(fields.student_class[0])) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid class ID format"
                        });
                    }
                }

                // Validate class ID
                if (!mongoose.Types.ObjectId.isValid(fields.student_class[0])) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid class ID format"
                    });
                }

                // Handle image upload
                const uploadDir = path.join(
                    process.cwd(),
                    process.env.STUDENT_IMAGE_PATH
                );

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
                }

                const studentImage = handleFileUpload(files, uploadDir, 'student_image');

                // Create student entry
                const hashedPassword = bcrypt.hashSync(rawPassword, 10);

                const newStudent = new Student({
                    school: req.user.schoolId,
                    email: email,
                    name: fields.name[0],
                    student_class: fields.student_class[0], age: fields.age[0],
                    gender: fields.gender[0],
                    guardian: fields.guardian[0],
                    guardian_phone: fields.guardian_phone[0],
                    student_image: studentImage,
                    password: hashedPassword
                });

                const savedStudent = await newStudent.save();

                res.status(201).json({
                    success: true,
                    data: {
                        id: savedStudent._id,
                        email: savedStudent.email,
                        name: savedStudent.name
                    },
                    message: "Student registered successfully"
                });

            } catch (error) {
                console.error("Registration error:", error);

                if (error.code === 11000) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already exists in the system"
                    });
                }

                res.status(500).json({
                    success: false,
                    message: "Registration failed",
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login student
exports.loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const student = await Student.findOne({
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
        }).populate('school');

        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password.trim(), student.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const payload = {
            id: student._id.toString(),
            schoolId: student.school._id.toString(),
            name: student.name,
            image_url: student.student_image,
            role: "STUDENT",
            email: student.email,
            class: student.student_class 
        };

        const token = jwt.sign(
            payload,
            process.env.STUDENT_JWT_SECRET,
            { expiresIn: '7d', algorithm: 'HS256' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            user: payload
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all students (updated to populate class)
exports.getAllStudents = async (req, res) => {
    try {
        console.log('User making request:', req.user); // Debug log

        const filter = {};
        if (req.user.role === 'SCHOOL') {
            if (!req.user.schoolId) {
                return res.status(400).json({
                    success: false,
                    message: "School ID is missing in token"
                });
            }
            filter.school = req.user.schoolId;
        }

        console.log('Database query filter:', filter); // Debug lFog

        const students = await Student.find(filter)
            .populate('student_class', 'class_text')
            .select('-password -__v')
            .lean();

        console.log('Found students:', students.length); // Debug log

        res.status(200).json({
            success: true,
            message: "Students fetched successfully",
            count: students.length,
            data: students
        });
    } catch (error) {
        console.error("Get all students error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: error.message // Always include error message in development
        });
    }
};
// Get single student data
exports.getStudentById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID format"
            });
        }

        const filter = { _id: req.params.id };
        if (req.user.role === 'SCHOOL') {
            filter.school = req.user.schoolId;
        }

        const student = await Student.findOne(filter)
            .populate('student_class', 'class_text') // Populate class with only class_text
            .select('-password')
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found or unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error("Get student error:", error);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID format"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to fetch student data",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update student details
exports.updateStudent = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            try {
                let student;
                if (req.user.role === 'STUDENT') {
                    student = await Student.findById(req.user.id);
                } else if (req.user.role === 'SCHOOL') {
                    const studentId = fields.studentId?.[0] || req.user.id;
                    if (!studentId) {
                        return res.status(400).json({
                            success: false,
                            message: "Student ID is required for school users"
                        });
                    }
                    student = await Student.findOne({
                        _id: studentId,
                        school: req.user.schoolId
                    });
                } else {
                    return res.status(403).json({
                        success: false,
                        message: "Unauthorized access"
                    });
                }

                if (!student) {
                    return res.status(404).json({
                        success: false,
                        message: "Student not found"
                    });
                }
                // In registerStudent and updateStudent
                if (fields.student_class) {
                    if (!mongoose.Types.ObjectId.isValid(fields.student_class[0])) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid class ID format"
                        });
                    }
                }
                // Handle image update
                if (files?.student_image) {
                    const uploadDir = path.join(process.cwd(), process.env.STUDENT_IMAGE_PATH);

                    // Delete old image
                    if (student.student_image) {
                        const oldPath = path.join(uploadDir, student.student_image);
                        if (fs.existsSync(oldPath)) {
                            fs.unlinkSync(oldPath);
                        }
                    }

                    const studentImage = handleFileUpload(files, uploadDir, 'student_image');
                    student.student_image = studentImage;
                }

                // Update allowed fields
                const allowedUpdates = ['name', 'student_class', 'age', 'gender', 'guardian', 'guardian_phone'];
                allowedUpdates.forEach(field => {
                    if (fields[field]) {
                        // Special handling for student_class
                        if (field === 'student_class') {
                            if (mongoose.Types.ObjectId.isValid(fields[field][0])) {
                                student.student_class = fields.student_class[0];
                            }
                        } else {
                            student[field] = fields[field][0].trim();
                        }
                    }
                });

                // Handle password update
                if (fields.password) {
                    const newPassword = fields.password[0].trim();
                    if (newPassword.length < 8) {
                        return res.status(400).json({
                            success: false,
                            message: "Password must be at least 8 characters"
                        });
                    }
                    student.password = bcrypt.hashSync(newPassword, 10);
                }

                await student.save();

                // Populate class before returning
                const studentData = await Student.findById(student._id)
                    .populate('student_class', 'class_text')
                    .select('-password -__v')
                    .lean();

                res.status(200).json({
                    success: true,
                    message: "Student updated successfully",
                    data: studentData
                });

            } catch (error) {
                console.error("Update error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to update student",
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        });
    } catch (error) {
        console.error("Update student error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// Get students with query filters (search and class)
exports.getStudentsWithQuery = async (req, res) => {
    try {
        const filterQuery = { school: req.user.schoolId };

        if (req.query.search) {
            filterQuery['name'] = { $regex: req.query.search, $options: 'i' };
        }

        if (req.query.student_class) {
            if (mongoose.Types.ObjectId.isValid(req.query.student_class)) {
                filterQuery['student_class'] = new mongoose.Types.ObjectId(req.query.student_class);
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid class ID format"
                });
            }
        }

        const students = await Student.find(filterQuery)
            .populate('student_class', 'class_text')
            .select('-password');

        res.status(200).json({
            success: true,
            message: "Successfully fetched filtered students",
            data: students
        });
    } catch (error) {
        console.error("Filter students error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete student by ID
exports.deleteStudentWithId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid student ID format"
            });
        }

        const student = await Student.findOneAndDelete({
            _id: req.params.id,
            school: req.user.schoolId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found or not authorized to delete"
            });
        }

        // Delete associated image if exists
        if (student.student_image) {
            const imagePath = path.join(
                process.cwd(),
                process.env.STUDENT_IMAGE_PATH,
                student.student_image
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        console.error("Delete student error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete student",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get logged-in student's own data
exports.getStudentOwnData = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id)
            .populate('student_class', 'class_text')
            .select('-password')
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error("Get student data error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student data",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

