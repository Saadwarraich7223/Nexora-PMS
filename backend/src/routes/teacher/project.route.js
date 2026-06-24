import express from "express";
import * as projectController from "../../controllers/teacher/project.controller.js";
import * as evaluationController from "../../controllers/teacher/evaluation.controller.js";
import { upload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// Static routes FIRST
router.get("/rubric-criteria", projectController.getRubricCriteria);
router.get("/", projectController.getProjectProposals);

// Parametric routes SECOND
router.post("/:projectId/approve", projectController.approveProject);
router.post("/:projectId/reject", projectController.rejectProject);
router.get("/:projectId/feedback", projectController.getProjectFeedback);
router.post(
  "/:projectId/feedback",
  upload.array("files", 5),
  projectController.addProjectFeedback,
);
router.post("/:projectId/analyze", projectController.analyzeProjectProposal);
router.post("/:projectId/generate-review", projectController.generateReviewProposal);
router.post("/:projectId/health", projectController.generateProjectHealth);
router.post("/:projectId/feedback/draft", projectController.generateFeedbackDraft);

// ─── Evaluation & Completion ─────────────────────────────────────────────────
router.get("/:projectId/completion-metrics", evaluationController.getCompletionMetrics);
router.get("/:projectId/evaluation/suggest", evaluationController.getSuggestedGrades);
router.post("/:projectId/evaluation", evaluationController.saveEvaluation);
router.post("/:projectId/evaluation/request-second-review", evaluationController.requestSecondReview);
router.post("/:projectId/evaluation/second-review-decision", evaluationController.submitSecondReviewDecision);
router.get("/:projectId/evaluation", evaluationController.getEvaluation);
router.get("/:projectId/evaluation/ai-justification", evaluationController.getAIEvaluationJustification);
router.post("/:projectId/complete", evaluationController.markProjectCompleted);

// Phase 2: Evidence & Milestones
router.get("/:projectId/evidence", projectController.getProjectEvidence);
router.patch("/:projectId/evidence/:evidenceId", projectController.validateEvidence);
router.get("/:projectId/milestones", projectController.getProjectMilestones);
router.post("/:projectId/milestones", projectController.createMilestone);
router.patch("/:projectId/milestones/:milestoneId", projectController.updateMilestone);
router.delete("/:projectId/milestones/:milestoneId", projectController.deleteMilestone);

export default router;
