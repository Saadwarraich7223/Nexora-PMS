import express from "express";
import * as taskController from "../../controllers/student/task.controller.js";

const router = express.Router();

router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.get("/:taskId", taskController.getTask);
router.put("/:taskId", taskController.updateTask);
router.patch("/:taskId/resources", taskController.setTaskResources);
router.delete("/:taskId", taskController.deleteTask);

export default router;
