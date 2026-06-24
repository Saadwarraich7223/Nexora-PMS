import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import teacherRoutes from "./admin/teacher.route.js";
import groupRoutes from "./admin/group.route.js";
import preApprovedRoutes from "./admin/preApproved.route.js";
import supervisorRoutes from "./admin/supervisor.route.js";
import analyticsRoutes from "./admin/analytics.route.js";
import studentRoutes from "./admin/student.route.js";
import broadcastRoutes from "./admin/broadcast.route.js";
import evaluationRoutes from "./admin/evaluation.route.js";

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.use("/teachers", teacherRoutes);
router.use("/groups", groupRoutes);
router.use("/preapproved", preApprovedRoutes);
router.use("/supervisors", supervisorRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/students", studentRoutes);
router.use("/broadcasts", broadcastRoutes);
router.use("/evaluations", evaluationRoutes);

export default router;
