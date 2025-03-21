require("dotenv").config();
const formidable = require("formidable");
const School = require("../models/school.model");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
    // Register a new school
    registerSchool: async (req, res) => {
        try {
            const form = new formidable.IncomingForm();
            
            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return res.status(400).json({ success: false, message: "Form parsing error", error: err });
                }
                try {
                    // Process the uploaded image
                    const photo = files.image[0];
                    let filepath = photo.filepath;
                    let originFilename = photo.originalFilename.replace(" ", "_");
                    let newPath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, originFilename);
                    
                    let photoData = fs.readFileSync(filepath);
                    fs.writeFileSync(newPath, photoData);

                    // Hash the password before saving
                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(fields.password[0], salt);

                    // Create a new school entry
                    const newSchool = new School({
                        school_name: fields.school_name[0],
                        email: fields.email[0],
                        owner_name: fields.owner_name[0],
                        password: hashPassword,
                    });

                    const savedSchool = await newSchool.save();
                    res.status(200).json({
                        success: true,
                        data: savedSchool,
                        message: "School is registered successfully."
                    });
                } catch (error) {
                    res.status(500).json({ success: false, message: "Error saving school", error: error.message });
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error", error: error.message });
        }
    },

    // Login a school
    loginSchool: async (req, res) => {
        try {
            const school = await School.findOne({ email: req.body.email });
            if (school) {
                const isAuth = bcrypt.compareSync(req.body.password, school.password);
                if (isAuth) {
                    const jwtSecret = process.env.JWT_SECRET;
                    const token = jwt.sign({
                        id: school._id,
                        schoolId: school._id,
                        owner_name: school.owner_name,
                        school_name: school.school_name,
                        image_url: school.school_image,
                        role: "SCHOOL"
                    }, jwtSecret);
                    
                    res.header("Authorization", token);
                    res.status(200).json({
                        success: true,
                        message: "Login successful.",
                        user: {
                            id: school._id,
                            owner_name: school.owner_name,
                            school_name: school.school_name,
                            image_url: school.school_image,
                            role: "SCHOOL"
                        }
                    });
                } else {
                    res.status(401).json({ success: false, message: "Password is incorrect" });
                }
            } else {
                res.status(401).json({ success: false, message: "Email is not registered" });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal Server Error [SCHOOL LOGIN]", error: error.message });
        }
    },

    // Fetch all schools excluding sensitive data
     getAllSchools: async (req, res) => {
        try {
            const schools = await School.find().select(['-password','_id', '-email', '-owner_name', 'createdAt']);
            res.status(200).json({ success: true, message: "Successfully fetched all schools.", schools });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal Server Error [ALL SCHOOLS]" });
        }
    },

    // Fetch data of a single school by ID
    getSchoolOwnData: async (req, res) => {
        try {
            const { id } = req.params;
            const school = await School.findOne({ _id: id });
            if (school) {
                res.status(200).json({ success: true, message: "Successfully fetched school data.", school });
            } else {
                res.status(404).json({ success: false, message: "School not found" });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal Server Error [OWN SCHOOL DATA]", error: error.message });
        }
    },

    // Update school details
    updateSchool: async (req, res) => {
        try {
            const { id } = req.params;
            const form = new formidable.IncomingForm();

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return res.status(400).json({ success: false, message: "Form parsing error", error: err });
                }
                try {
                    const school = await School.findOne({ _id: id });
                    if (!school) {
                        return res.status(404).json({ success: false, message: "School not found" });
                    }

                    // Update school image if provided
                    if (files.image) {
                        const photo = files.image[0];
                        let filepath = photo.filepath;
                        let originFilename = photo.originalFilename.replace(" ", "_");
                        let newPath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, originFilename);

                        // Delete old image if it exists
                        if (school.school_image) {
                            let oldImagePath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, school.school_image);
                            if (fs.existsSync(oldImagePath)) {
                                fs.unlink(oldImagePath, (err) => {
                                    if (err) console.log("Error deleting old image", err);
                                });
                            }
                        }

                        let photoData = fs.readFileSync(filepath);
                        fs.writeFileSync(newPath, photoData);
                        school.school_image = originFilename;
                    }

                    // Update other fields
                    Object.keys(fields).forEach((field) => {
                        school[field] = fields[field][0];
                    });

                    await school.save();
                    res.status(200).json({ success: true, message: "School updated successfully", school });
                } catch (error) {
                    res.status(500).json({ success: false, message: "Error updating school", error: error.message });
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error", error: error.message });
        }
    }
};
