import asyncHandler from "../../utils/asyncHandler.js";
import * as evaluationService from "../../services/teacher/evaluation.service.js";
import { generateEvaluationJustificationAI } from "../../services/ai.service.js";
import Project from "../../models/project.model.js";
import ApiError from "../../utils/apiError.js";

const getCompletionMetrics = asyncHandler(async (req, res) => {
  const base = await evaluationService.calculateCompletionMetrics(
    req.params.projectId,
    req.user._id,
  );

  const policy = await evaluationService.evaluateCompletionReadiness(
    req.params.projectId,
    req.user._id,
    { requirePublishedEvaluation: true },
  );

  res.json({
    ...base,
    policy: {
      decision: policy.decision,
      readinessScore: policy.readinessScore,
      checks: policy.checks,
      failedChecks: policy.failedChecks,
      hasPublishedEvaluation: policy.hasPublishedEvaluation,
      requirePublishedEvaluation: policy.requirePublishedEvaluation,
      policy: {
        source: policy.policy?.source || "default",
        name: policy.policy?.name || "Default Completion Policy",
        version: policy.policy?.version || "grading-config-v1",
      },
    },
  });
});

const getSuggestedGrades = asyncHandler(async (req, res) => {
  const result = await evaluationService.calculateSuggestedGrades(
    req.params.projectId,
    req.user._id,
  );
  res.json(result);
});

const saveEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await evaluationService.saveEvaluation(
    req.params.projectId,
    req.user._id,
    req.body,
  );
  res.json({ message: "Evaluation saved", evaluation });
});

const getEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await evaluationService.getEvaluation(
    req.params.projectId,
    req.user._id,
  );
  res.json({ evaluation });
});

const requestSecondReview = asyncHandler(async (req, res) => {
  const evaluation = await evaluationService.requestSecondReview(
    req.params.projectId,
    req.user._id,
    req.body,
  );
  res.json({ message: "Second review requested", evaluation });
});

const submitSecondReviewDecision = asyncHandler(async (req, res) => {
  const evaluation = await evaluationService.submitSecondReviewDecision(
    req.params.projectId,
    req.user._id,
    req.body,
  );
  res.json({ message: "Second review decision recorded", evaluation });
});

const markProjectCompleted = asyncHandler(async (req, res) => {
  const project = await evaluationService.markProjectCompleted(
    req.params.projectId,
    req.user._id,
  );
  res.json({ message: "Project marked as completed", project });
});

const getAIEvaluationJustification = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // Get current metrics, suggestions and cohort benchmarks
  const [suggested, benchmarks] = await Promise.all([
    evaluationService.calculateSuggestedGrades(projectId, teacherId),
    evaluationService.calculateClassBenchmarks(projectId)
  ]);

  const { groupGrade, memberGrades } = suggested;

  const aiData = await generateEvaluationJustificationAI({
    title: project.title,
    metrics: groupGrade.breakdown,
    suggestedScore: groupGrade.score,
    memberGrades: memberGrades,
    benchmarks: benchmarks // Pass class averages and thresholds
  });

  res.json({
    message: "AI evaluation justification generated successfully",
    ...aiData
  });
});

export {
  getCompletionMetrics,
  getSuggestedGrades,
  saveEvaluation,
  requestSecondReview,
  submitSecondReviewDecision,
  getEvaluation,
  markProjectCompleted,
  getAIEvaluationJustification,
};
