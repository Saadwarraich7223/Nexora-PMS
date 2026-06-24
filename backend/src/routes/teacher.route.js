import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import groupRoutes from "./teacher/group.route.js";
import projectRoutes from "./teacher/project.route.js";
import meetingRoutes from "./teacher/meeting.route.js";
import deadlineRoutes from "./teacher/deadline.route.js";
import resourceRoutes from "./teacher/resource.route.js";
import gradingTemplateRoutes from "./teacher/gradingTemplate.route.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("teacher"));

router.use("/groups", groupRoutes);
router.use("/projects", projectRoutes);
router.use("/meetings", meetingRoutes);
router.use("/deadlines", deadlineRoutes);
router.use("/resources", resourceRoutes);
router.use("/grading-templates", gradingTemplateRoutes);

export default router;
