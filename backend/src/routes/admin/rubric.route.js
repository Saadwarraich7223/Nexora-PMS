import express from "express";
import { getRubricAlignmentReport, listActiveCriteria } from "../../controllers/admin/rubric.controller.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import roleMiddleware from "../../middleware/roleMiddleware.js";

const router = express.Router();

// Allow both admin and teacher to view the alignment report
router.get("/alignment/:groupId", authMiddleware, roleMiddleware("admin", "teacher", "student"), getRubricAlignmentReport);

// Allow anyone (auth) to list active criteria for task/file linkage
router.get("/criteria", authMiddleware, listActiveCriteria);

export default router;
