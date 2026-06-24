import express from "express";
import * as projectController from "../../controllers/student/project.controller.js";
import { upload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// Static routes FIRST
router.get("/rubric-criteria", projectController.getRubricCriteria);
router.post("/submit", upload.array("files", 5), projectController.submitProposal);
router.get("/my", projectController.getMyProject);
router.delete("/my", projectController.deleteMyProject);

// Parametric routes SECOND
router.get("/:projectId/feedback", projectController.getProjectFeedback);
router.patch("/:projectId/canvas", projectController.saveCanvasState);
router.get("/:projectId/evaluation", projectController.getEvaluation);
router.post("/:projectId/evaluation/challenges", projectController.submitGradeChallenge);
router.get("/:projectId/evaluation/challenges", projectController.getGradeChallenges);

// Phase 2: Evidence & Milestones
router.get("/:projectId/evidence", projectController.getProjectEvidence);
router.post("/:projectId/evidence", upload.single("file"), projectController.submitEvidence);
router.get("/:projectId/milestones", projectController.getProjectMilestones);

export default router;
