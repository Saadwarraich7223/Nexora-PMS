import express from "express";
import * as deadlineController from "../../controllers/teacher/deadline.controller.js";

const router = express.Router();

router.post("/projects/:projectId", deadlineController.createDeadline);
router.get("/projects/:projectId", deadlineController.getProjectDeadlines);
router.delete("/:deadlineId", deadlineController.deleteDeadline);
router.patch("/:deadlineId/override", deadlineController.overrideDeadlineStatus);

export default router;
