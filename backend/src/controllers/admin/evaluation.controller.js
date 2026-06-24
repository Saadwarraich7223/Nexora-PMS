import * as evaluationService from "../../services/admin/evaluation.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

/**
 * @route   GET /api/admin/evaluations/stats
 * @desc    Get top-level evaluation statistics (Tier 1)
 * @access  Private/Admin
 */
export const getEvaluationStats = asyncHandler(async (req, res) => {
  const stats = await evaluationService.getEvaluationStats();
  res.status(200).json({
    status: "success",
    stats,
  });
});

/**
 * @route   GET /api/admin/evaluations
 * @desc    Get all evaluations with details (Tier 2)
 * @access  Private/Admin
 */
export const getAllEvaluations = asyncHandler(async (req, res) => {
  const evaluations = await evaluationService.getAllEvaluations();
  res.status(200).json({
    status: "success",
    evaluations,
  });
});

/**
 * @route   GET /api/admin/evaluations/by-department
 * @desc    Get evaluations aggregated by department (Tier 2)
 * @access  Private/Admin
 */
export const getEvaluationsByDepartment = asyncHandler(async (req, res) => {
  const stats = await evaluationService.getEvaluationsByDepartment();
  res.status(200).json({
    status: "success",
    stats,
  });
});

/**
 * @route   GET /api/admin/evaluations/by-supervisor
 * @desc    Get evaluations aggregated by supervisor (Tier 2)
 * @access  Private/Admin
 */
export const getEvaluationsBySupervisor = asyncHandler(async (req, res) => {
  const stats = await evaluationService.getEvaluationsBySupervisor();
  res.status(200).json({
    status: "success",
    stats,
  });
});

export const getGradeChallenges = asyncHandler(async (req, res) => {
  const challenges = await evaluationService.getGradeChallenges({
    status: req.query.status,
  });

  res.status(200).json({
    status: "success",
    count: challenges.length,
    challenges,
  });
});

export const resolveGradeChallenge = asyncHandler(async (req, res) => {
  const challenge = await evaluationService.resolveGradeChallenge(
    req.params.challengeId,
    req.user._id,
    req.body,
  );

  res.status(200).json({
    status: "success",
    message: "Grade challenge updated successfully",
    challenge,
  });
});
