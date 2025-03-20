require("dotenv").config();
const formidable = require("formidable");
const School = require("../models/school.model");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

module.exports = {
    registerSchool: async (req, res) => {
        try {
            const form = new formidable.IncomingForm();

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    return res.status(400).json({ success: false, message: "Form parsing error", error: err });
                }

                try {
                    const photo = files.image[0];
                    let filepath = photo.filepath;
                    let originFilename = photo.originalFilename.replace(" ", "_");
                    let newPath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, originFilename);

                    let photoData = fs.readFileSync(filepath);
                    fs.writeFileSync(newPath, photoData);

                    const salt = bcrypt.genSaltSync(10);
                    const hashPassword = bcrypt.hashSync(fields.password[0], salt);

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
                        message: "School is registered successfully.",
                    });

                } catch (error) {
                    res.status(500).json({ success: false, message: "Error saving school", error: error.message });
                }
            });

        } catch (error) {
            res.status(500).json({ success: false, message: "Internal server error", error: error.message });
        }
    },

loginSchool: async(req, res)=>{
    try{
        const school = await School.findOne({email:req.body.email});
        if(School){
         const isAuth = bcrypt.compareSync(req.body.password, school.password)
         if(isAuth){

            const jwtSecret = process.env.JWT_SECRET;
            const token = jwt.sign({
                id: school._id,
                schoolId: School._id,
                owner_name: school.owner_name,
                school_name: school.school_name,
                image_url: school.school_image,
                role:"SCHOOL"}, jwtSecret)
            res.header("Authorization", token)
            res.status(401).json({success:true, message:"Success Login. ",
                user:{
                    id: school._id,
                    owner_name: school.owner_name,
                    school_name: school.school_name,
                    image_url: school.school_image,
                    role:"SCHOOL"

                }
            })
         }else{
            res.status(401).json({success:false, message:"Password is incorrect"})

         }
        }else{
            res.status(401).json({success:false, message:"Email is not registered"})
        }
    }catch(error){

            res.status(500).json({success:false, message:"Internal Server Error [SCHOOL LOGIN]"})

    }
},

};
