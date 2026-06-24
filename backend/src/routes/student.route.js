import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import groupRoutes from "./student/group.route.js";
import projectRoutes from "./student/project.route.js";
import resourceRoutes from "./student/resource.route.js";
import taskRoutes from "./student/task.route.js";
import featureRoutes from "./student/feature.route.js";
import meetingRoutes from "./student/meeting.route.js";
import deadlineRoutes from "./student/deadline.route.js";
import aiRoutes from "./student/ai.route.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("student"));

router.use("/groups", groupRoutes);
router.use("/projects", projectRoutes);
router.use("/resources", resourceRoutes);
router.use("/tasks", taskRoutes);
router.use("/features", featureRoutes);
router.use("/meetings", meetingRoutes);
router.use("/deadlines", deadlineRoutes);
router.use("/ai", aiRoutes);

export default router;
