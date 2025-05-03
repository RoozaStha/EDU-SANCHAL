require("dotenv").config();
const formidable = require("formidable");
const School = require("../models/school.model");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');



module.exports = {
    // Register a new school
    registerSchool: async (req, res) => {
        try {
            const form = new formidable.IncomingForm();

            form.parse(req, async (err, fields, files) => {
                try {
                    // ========================
                    // 1. VALIDATE INPUT FIELDS
                    // ========================
                    const requiredFields = ['school_name', 'email', 'owner_name', 'password'];
                    const missingFields = requiredFields.filter(field => !fields[field]);

                    if (missingFields.length > 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Missing required fields: ${missingFields.join(', ')}`
                        });
                    }

                    // ======================
                    // 2. PROCESS CREDENTIALS
                    // ======================
                    const email = fields.email[0].trim().toLowerCase();
                    const rawPassword = fields.password[0].trim();

                    // Email validation
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid email format"
                        });
                    }

                    // Password strength check
                    if (rawPassword.length < 8) {
                        return res.status(400).json({
                            success: false,
                            message: "Password must be at least 8 characters"
                        });
                    }

                    // =====================
                    // 3. CHECK EXISTING USER
                    // =====================
                    const existingSchool = await School.findOne({
                        email: { $regex: new RegExp(`^${email}$`, "i") }
                    });

                    if (existingSchool) {
                        return res.status(409).json({
                            success: false,
                            message: "Email already registered"
                        });
                    }

                    // ====================
                    // 4. HANDLE IMAGE UPLOAD
                    // ====================
                    // ====================
                    // 4. HANDLE IMAGE UPLOAD
                    // ====================
                    const uploadDir = path.join(
                        process.cwd(), // Start from project root
                        process.env.SCHOOL_IMAGE_PATH
                    );

                    // Create directory if not exists
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, {
                            recursive: true,
                            mode: 0o755
                        });
                        console.log('Directory created at:', uploadDir);
                    } else {
                        console.log('Directory already exists at:', uploadDir);
                    }

                    // Validate image file
                    if (!files?.school_image) {
                        return res.status(400).json({
                            success: false,
                            message: "School image is required"
                        });
                    }

                    const photo = files.school_image[0];
                    console.log('Project root:', process.cwd());
                    console.log('Resolved upload path:', uploadDir);

                    // Sanitize filename
                    const sanitizedFilename = `${Date.now()}-${photo.originalFilename
                        .replace(/ /g, "_")
                        .replace(/[^a-zA-Z0-9_.-]/g, "")
                        .toLowerCase()}`;

                    const newPath = path.join(uploadDir, sanitizedFilename);
                    console.log('Target path:', newPath); // Debug log

                    // Save file
                    fs.renameSync(photo.filepath, newPath); // Use renameSync instead of writeFileSync

                    // ====================
                    // 5. CREATE SCHOOL ENTRY
                    // ====================
                    const hashedPassword = bcrypt.hashSync(rawPassword, 10);

                    const newSchool = new School({
                        school_name: fields.school_name[0].trim(),
                        email: email,
                        owner_name: fields.owner_name[0].trim(),
                        password: hashedPassword,
                        school_image: sanitizedFilename
                    });

                    const savedSchool = await newSchool.save();

                    // =================
                    // 6. SEND RESPONSE
                    // =================
                    res.status(201).json({
                        success: true,
                        data: {
                            id: savedSchool._id,
                            email: savedSchool.email,
                            school_name: savedSchool.school_name
                        },
                        message: "School registered successfully"
                    });

                } catch (error) {
                    console.error("Registration error:", error);

                    // Handle duplicate key error
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
    },

    // Login a school
    loginSchool: async (req, res) => {
        try {
            // Trim and case-insensitive email search
            const email = req.body.email.trim().toLowerCase();
            const school = await School.findOne({
                email: { $regex: new RegExp(`^${email}$`, "i") }
            });

            if (!school) {
                return res.status(401).json({
                    success: false,
                    message: "Email is not registered"
                });
            }

            // Password comparison
            const isMatch = bcrypt.compareSync(req.body.password.trim(), school.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Password is incorrect"
                });
            }

            // JWT generation
            const token = jwt.sign(
                {
                    id: school._id,
                    role: "SCHOOL"
                },
                process.env.SchoolJWT_SECRET,
                { expiresIn: '1h' }
            );

            // Successful response
            res.status(200).json({
                success: true,
                message: "Login successful.",
                token: token,
                user: {
                    id: school._id,
                    owner_name: school.owner_name,
                    school_name: school.school_name,
                    image_url: school.school_image,
                    role: "SCHOOL"
                }
            });

        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error [SCHOOL LOGIN]",
                error: error.message
            });
        }
    },

    // Fetch all schools excluding sensitive data
    getAllSchools: async (req, res) => {
        try {
            const schools = await School.find()
                .select('-password -__v -createdAt -updatedAt')
                .lean();

            res.status(200).json({
                success: true,
                message: "Schools fetched successfully",
                count: schools.length,
                data: schools
            });
        } catch (error) {
            console.error("Get all schools error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch schools",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Fetch data of a single school by ID
    getSchoolOwnData: async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid school ID format"
                });
            }

            const school = await School.findById(id)
                .select('-password -__v')
                .lean();

            if (!school) {
                return res.status(404).json({
                    success: false,
                    message: "School not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "School data retrieved",
                data: school
            });

        } catch (error) {
            console.error("Get school error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch school data",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Update school details
    updateSchool: async (req, res) => {
        try {
            const { id } = req.user; // Get ID from authenticated user
            const form = new formidable.IncomingForm();

            form.parse(req, async (err, fields, files) => {
                try {
                    // Validate school exists
                    const school = await School.findById(id);
                    if (!school) {
                        return res.status(404).json({
                            success: false,
                            message: "School not found"
                        });
                    }

                    // Handle image update
                    if (files?.school_image) {
                        const photo = files.school_image[0];
                        const uploadDir = path.join(process.cwd(), process.env.SCHOOL_IMAGE_PATH);

                        // Create directory if not exists
                        if (!fs.existsSync(uploadDir)) {
                            fs.mkdirSync(uploadDir, { recursive: true });
                        }

                        // Delete old image
                        if (school.school_image) {
                            const oldPath = path.join(uploadDir, school.school_image);
                            if (fs.existsSync(oldPath)) {
                                fs.unlinkSync(oldPath);
                            }
                        }

                        // Process new image
                        const sanitizedFilename = photo.originalFilename
                            .replace(/ /g, "_")
                            .replace(/[^a-zA-Z0-9_.-]/g, "");

                        const newPath = path.join(uploadDir, sanitizedFilename);
                        fs.writeFileSync(newPath, fs.readFileSync(photo.filepath));
                        school.school_image = sanitizedFilename;
                    }

                    // Update allowed fields
                    const allowedUpdates = ['school_name', 'owner_name'];
                    allowedUpdates.forEach(field => {
                        if (fields[field]) {
                            school[field] = fields[field][0].trim();
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
                        school.password = bcrypt.hashSync(newPassword, 10);
                    }

                    await school.save();

                    // Remove sensitive data before sending response
                    const schoolData = school.toObject();
                    delete schoolData.password;
                    delete schoolData.__v;

                    res.status(200).json({
                        success: true,
                        message: "School updated successfully",
                        data: schoolData
                    });

                } catch (error) {
                    console.error("Update error:", error);
                    res.status(500).json({
                        success: false,
                        message: "Failed to update school",
                        error: process.env.NODE_ENV === 'development' ? error.message : undefined
                    });
                }
            });
        } catch (error) {
            console.error("Update school error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}