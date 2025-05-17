const express = require("express");
const authMiddleware = require("../auth/auth");
const { createClass, getAllClasses, updateClassWithId, deleteClassWithId } = require("../controllers/class.controller");

const router = express.Router();

router.post("/create", authMiddleware(['SCHOOL']), createClass);
router.get("/all", authMiddleware(['SCHOOL','TEACHER']), getAllClasses);
router.patch("/update/:id", authMiddleware(['SCHOOL','TEACHER']), updateClassWithId); // AUTHENTICATED USER FOR UPDATE
router.delete("/delete/:id", authMiddleware(['SCHOOL','TEACHER']), deleteClassWithId);

module.exports = router;
