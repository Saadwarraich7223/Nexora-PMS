import express from "express";
import * as teacherController from "../../controllers/admin/teacher.controller.js";

const router = express.Router();

router.get("/", teacherController.getTeachers);
router.post("/", teacherController.createTeacher);
router.get("/:teacherId", teacherController.getTeacherById);
router.put("/:teacherId", teacherController.updateTeacher);
router.delete("/:teacherId", teacherController.deleteTeacher);
router.patch("/:teacherId/capacity", teacherController.updateTeacherCapacity);
router.get("/:teacherId/groups", teacherController.getAssignedGroups);

export default router;
