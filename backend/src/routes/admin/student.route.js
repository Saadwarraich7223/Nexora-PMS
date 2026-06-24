import express from "express";
import * as studentController from "../../controllers/admin/student.controller.js";

const router = express.Router();

router.get("/", studentController.listStudents);
router.get("/:studentId", studentController.getStudentById);

export default router;
