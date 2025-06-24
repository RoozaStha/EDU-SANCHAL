const formidable = require('formidable');
const Teacher = require('../models/teacher.model');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendVerificationEmail } = require('./emailVerification.controller');

// Helper function for file uploads
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

// Register a new teacher
exports.registerTeacher = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            try {
                // Validate input fields
                const requiredFields = ['name', 'email', 'qualification', 'age', 'gender', 'password'];
                const missingFields = requiredFields.filter(field => !fields[field]);

                if (missingFields.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    });
                }

                const email = fields.email[0].trim().toLowerCase();
                const rawPassword = fields.password[0].trim();
                const classId = fields.class?.[0] || null;
                const isClassTeacher = fields.is_class_teacher?.[0] === 'true';

                // Email validation
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid email format"
                    });
                }

                // Password validation
                if (rawPassword.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: "Password must be at least 8 characters"
                    });
                }

                // Check if teacher already exists
                const existingTeacher = await Teacher.findOne({
                    email: { $regex: new RegExp(`^${email}$`, "i") }
                });

                if (existingTeacher) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already registered"
                    });
                }

                // Check if class teacher assignment is valid
                if (isClassTeacher && classId) {
                    const existingClassTeacher = await Teacher.findOne({
                        class: classId,
                        is_class_teacher: true
                    });

                    if (existingClassTeacher) {
                        return res.status(400).json({
                            success: false,
                            message: `Class already has a class teacher: ${existingClassTeacher.name}`
                        });
                    }
                }

                // Handle image upload
                const uploadDir = path.join(process.cwd(), process.env.TEACHER_IMAGE_PATH);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
                }

                const teacherImage = handleFileUpload(files, uploadDir, 'teacher_image');

                // Create new teacher
                const hashedPassword = bcrypt.hashSync(rawPassword, 10);

                const newTeacher = new Teacher({
                    school: req.user.schoolId,
                    email: email,
                    name: fields.name[0],
                    qualification: fields.qualification[0],
                    age: fields.age[0],
                    gender: fields.gender[0],
                    teacher_image: teacherImage,
                    password: hashedPassword,
                    class: classId,
                    is_class_teacher: isClassTeacher,
                    subjects: fields.subjects?.[0]?.split(',') || []
                });

                const savedTeacher = await newTeacher.save();
                try {
                    await sendVerificationEmail(savedTeacher, 'teacher');
                } catch (error) {
                    console.error("Failed to send verification email:", error);
                }
                res.status(201).json({
                    success: true,
                    message: "Student registered. Check email for verification link."
                });

            } catch (error) {
                console.error("Teacher registration error:", error);
                res.status(500).json({
                    success: false,
                    message: "Teacher registration failed",
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


// Add verification check to login
exports.loginTeacher = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const teacher = await Teacher.findOne({
            email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
        }).populate('school class subjects');

        if (!teacher) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Add verification check
        if (!teacher.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Account not verified. Please check your email."
            });
        }

        const isMatch = await bcrypt.compare(password.trim(), teacher.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const payload = {
            id: teacher._id.toString(),
            schoolId: teacher.school?._id.toString(),
            name: teacher.name,
            image_url: teacher.teacher_image,
            role: "TEACHER",
            email: teacher.email
        };

        const token = jwt.sign(
            payload,
            process.env.TEACHER_JWT_SECRET,
            { expiresIn: '7d', algorithm: 'HS256' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            user: payload
        });

    } catch (error) {
        console.error("Teacher login error:", error);
        res.status(500).json({
            success: false,
            message: "Login failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// Get all teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'SCHOOL') {
            filter.school = req.user.schoolId;
        }

        const teachers = await Teacher.find(filter)
            .select('-password -__v')
            .populate('class', 'name class_text')
            .populate('subjects', 'name')
            .lean();

        res.status(200).json({
            success: true,
            message: "Teachers fetched successfully",
            count: teachers.length,
            data: teachers
        });
    } catch (error) {
        console.error("Get all teachers error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch teachers",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get teacher by ID
exports.getTeacherById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher ID format"
            });
        }

        const filter = { _id: req.params.id };
        if (req.user.role === 'SCHOOL') {
            filter.school = req.user.schoolId;
        }

        const teacher = await Teacher.findOne(filter)
            .select('-password')
            .populate('class', 'name class_text')
            .populate('subjects', 'name')
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found or unauthorized"
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });

    } catch (error) {
        console.error("Get teacher error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch teacher data",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            try {
                let teacher;
                if (req.user.role === 'TEACHER') {
                    teacher = await Teacher.findById(req.user.id);
                } else if (req.user.role === 'SCHOOL') {
                    const teacherId = fields.teacherId?.[0] || req.user.id;
                    teacher = await Teacher.findOne({
                        _id: teacherId,
                        school: req.user.schoolId
                    });
                } else {
                    return res.status(403).json({
                        success: false,
                        message: "Unauthorized access"
                    });
                }

                if (!teacher) {
                    return res.status(404).json({
                        success: false,
                        message: "Teacher not found"
                    });
                }

                // Handle class teacher assignment
                const newClassId = fields.class?.[0] || null;
                const newIsClassTeacher = fields.is_class_teacher?.[0] === 'true';

                if (newIsClassTeacher && newClassId) {
                    // Check if another teacher is already class teacher of this class
                    const existingClassTeacher = await Teacher.findOne({
                        class: newClassId,
                        is_class_teacher: true,
                        _id: { $ne: teacher._id }
                    });

                    if (existingClassTeacher) {
                        return res.status(400).json({
                            success: false,
                            message: `Class already has a class teacher: ${existingClassTeacher.name}`
                        });
                    }
                }

                // Handle image update
                if (files?.teacher_image) {
                    const uploadDir = path.join(process.cwd(), process.env.TEACHER_IMAGE_PATH);

                    // Delete old image
                    if (teacher.teacher_image) {
                        const oldPath = path.join(uploadDir, teacher.teacher_image);
                        if (fs.existsSync(oldPath)) {
                            fs.unlinkSync(oldPath);
                        }
                    }

                    const teacherImage = handleFileUpload(files, uploadDir, 'teacher_image');
                    teacher.teacher_image = teacherImage;
                }

                // Update fields
                const allowedUpdates = [
                    'name', 'qualification', 'age', 'gender',
                    'class', 'is_class_teacher', 'subjects'
                ];

                allowedUpdates.forEach(field => {
                    if (fields[field]) {
                        if (field === 'subjects') {
                            teacher[field] = fields[field][0]?.split(',') || [];
                        } else if (field === 'class') {
                            teacher[field] = fields[field][0] || null;
                        } else if (field === 'is_class_teacher') {
                            teacher[field] = fields[field][0] === 'true';
                        } else {
                            teacher[field] = fields[field][0].trim();
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
                    teacher.password = bcrypt.hashSync(newPassword, 10);
                }

                await teacher.save();

                const updatedTeacher = await Teacher.findById(teacher._id)
                    .select('-password -__v')
                    .populate('class', 'name class_text')
                    .populate('subjects', 'name')
                    .lean();

                res.status(200).json({
                    success: true,
                    message: "Teacher updated successfully",
                    data: updatedTeacher
                });

            } catch (error) {
                console.error("Teacher update error:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to update teacher",
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        });
    } catch (error) {
        console.error("Update teacher error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get class teacher for a class
exports.getClassTeacher = async (req, res) => {
    try {
        const classId = req.params.classId;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid class ID format"
            });
        }

        const classTeacher = await Teacher.findOne({
            class: classId,
            is_class_teacher: true,
            school: req.user.schoolId
        })
            .select('_id name email teacher_image')
            .lean();

        if (!classTeacher) {
            return res.status(404).json({
                success: false,
                message: "No class teacher assigned for this class"
            });
        }

        res.status(200).json({
            success: true,
            data: classTeacher
        });

    } catch (error) {
        console.error("Get class teacher error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch class teacher",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Delete teacher
exports.deleteTeacherWithId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid teacher ID format"
            });
        }

        const teacher = await Teacher.findOneAndDelete({
            _id: req.params.id,
            school: req.user.schoolId
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found or not authorized to delete"
            });
        }

        // Delete associated image
        if (teacher.teacher_image) {
            const imagePath = path.join(
                process.cwd(),
                process.env.TEACHER_IMAGE_PATH,
                teacher.teacher_image
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.status(200).json({
            success: true,
            message: "Teacher deleted successfully"
        });

    } catch (error) {
        console.error("Delete teacher error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete teacher",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get teacher's own data
exports.getTeacherOwnData = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.user.id)
            .select('-password')
            .populate('class', 'name class_text')
            .populate('subjects', 'name')
            .lean();

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.status(200).json({
            success: true,
            data: teacher
        });

    } catch (error) {
        console.error("Get teacher data error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch teacher data",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};