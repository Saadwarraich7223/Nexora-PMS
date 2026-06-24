import asyncHandler from "../../utils/asyncHandler.js";
import * as projectService from "../../services/teacher/project.service.js";
import {
  analyzeProposalAI,
  generateFeedbackDraftAI,
} from "../../services/ai.service.js";
import Project from "../../models/project.model.js";
import Group from "../../models/group.model.js";
import RubricCriteria from "../../models/rubricCriteria.model.js";
import ApiError from "../../utils/apiError.js";
import { generateProjectHealthReport } from "../../services/teacher/health.service.js";
import ragService from "../../services/rag.service.js";
import { logger } from '../../utils/logger.js';


const parseFeatureIds = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map(String)
      .map((id) => id.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(String)
          .map((id) => id.trim())
          .filter(Boolean);
      }
    } catch {
      // fallback to csv parsing
    }

    return trimmed
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return [];
};

const approveProject = asyncHandler(async (req, res) => {
  const project = await projectService.approveProject({
    projectId: req.params.projectId,
    reviewerId: req.user._id,
    feedbackMessage: req.body.feedbackMessage,
  });
  res.json({ message: "Project proposal approved", project });
});

const rejectProject = asyncHandler(async (req, res) => {
  const project = await projectService.rejectProject({
    projectId: req.params.projectId,
    reviewerId: req.user._id,
    feedbackMessage: req.body.feedbackMessage,
  });
  res.json({ message: "Project proposal rejected", project });
});

const getProjectProposals = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const status = req.query.status || "submitted";
  const projects = await projectService.getProjectProposals(teacherId, {
    status,
  });
  res.json({
    message: "Project proposals fetched successfully",
    count: projects.length,
    status,
    projects,
  });
});

const addProjectFeedback = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;
  const { type, title, message, priority } = req.body;
  const featureIds = parseFeatureIds(req.body.featureIds);

  const attachments = req.files
    ? req.files.map((file) => ({
        fileUrl: file.path,
        originalName: file.originalname,
        fileType: file.mimetype,
      }))
    : [];

  const feedback = await projectService.addProjectFeedback({
    projectId,
    teacherId,
    type,
    title,
    message,
    priority,
    attachments,
    featureIds,
  });

  res.status(201).json({
    message: "Project feedback added successfully",
    feedback,
  });
});

const getProjectFeedback = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;
  const feedback = await projectService.getProjectFeedback(
    teacherId,
    projectId,
  );

  res.json({
    message: "Project feedback fetched successfully",
    count: feedback.length,
    feedback,
  });
});

const analyzeProjectProposal = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;

  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");

  const group = project.group;
  if (!group || !group.supervisor || !group.supervisor.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  // RAG: Fetch historical projects for context
  // We'll fetch a sample of approved projects from the same department if possible
  const historicalProjects = await Project.find({
    status: { $in: ["approved", "completed", "in_progress"] },
    _id: { $ne: project._id },
  }).limit(50);

  logger.info(historicalProjects);
  const context = await ragService.retrieveProjectContext(
    project,
    historicalProjects,
  );

  const aiAnalysis = await analyzeProposalAI(
    project.title,
    project.description,
    context,
  );

  project.analysis = aiAnalysis;
  await project.save();

  res.json({
    message: "AI analysis completed successfully with RAG context",
    analysis: project.analysis,
  });
});

const generateReviewProposal = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;
  const { decision } = req.body; // "approve" | "reject"

  if (!["approve", "reject"].includes(decision)) {
    throw new ApiError(
      400,
      "Invalid decision type. Must be 'approve' or 'reject'.",
    );
  }

  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");

  const group = project.group;
  if (!group || !group.supervisor || !group.supervisor.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  // Use the existing analysis or generate a dummy one if it somehow doesn't exist
  const analysis = project.analysis || {};

  // We need to import generateProposalReview natively, so assuming it's imported at the top
  const { generateProposalReview } =
    await import("../../services/ai.service.js");

  const reviewText = await generateProposalReview(
    project.title,
    project.description,
    analysis,
    decision,
  );

  res.json({
    message: "AI review generated successfully",
    review: reviewText,
  });
});

const generateProjectHealth = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;

  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");

  const group = project.group;
  if (!group || !group.supervisor || !group.supervisor.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  const aiHealthReport = await generateProjectHealthReport(
    projectId,
    teacherId,
  );

  res.json({
    message: "Project health report generated successfully",
    healthReport: aiHealthReport,
  });
});

const generateFeedbackDraft = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const { projectId } = req.params;
  const { tone } = req.body; // "encouraging" | "direct" | "strict"

  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");

  const group = project.group;
  if (!group || !group.supervisor || !group.supervisor.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  // Get current metrics and health
  const health = project.healthReport || {};
  const metrics = project.completionMetrics || {};

  const draft = await generateFeedbackDraftAI({
    title: project.title,
    health,
    metrics,
    tone: tone || "professional",
  });

  res.json({
    message: "AI feedback draft generated successfully",
    draft,
  });
});

const getProjectMilestones = asyncHandler(async (req, res) => {
  const milestones = await projectService.getProjectMilestones(
    req.user._id,
    req.params.projectId,
  );
  res.json({ milestones });
});

const createMilestone = asyncHandler(async (req, res) => {
  const milestone = await projectService.createMilestone(
    req.user._id,
    req.params.projectId,
    req.body,
  );
  res.json({ message: "Milestone created successfully", milestone });
});

const updateMilestone = asyncHandler(async (req, res) => {
  const milestone = await projectService.updateMilestone(
    req.user._id,
    req.params.milestoneId,
    req.body,
  );
  res.json({ message: "Milestone updated successfully", milestone });
});

const deleteMilestone = asyncHandler(async (req, res) => {
  await projectService.deleteMilestone(
    req.user._id,
    req.params.projectId,
    req.params.milestoneId,
  );
  res.json({ message: "Milestone deleted successfully" });
});

const getProjectEvidence = asyncHandler(async (req, res) => {
  const evidence = await projectService.getProjectEvidence(
    req.user._id,
    req.params.projectId,
  );
  res.json({ evidence });
});

const validateEvidence = asyncHandler(async (req, res) => {
  const evidence = await projectService.validateEvidence(
    req.user._id,
    req.params.projectId,
    req.params.evidenceId,
    req.body,
  );
  res.json({ message: "Evidence validated successfully", evidence });
});

const getRubricCriteria = asyncHandler(async (req, res) => {
  const criteria = await RubricCriteria.find({ isActive: true }).lean();
  res.json({ criteria });
});

export {
  approveProject,
  rejectProject,
  getProjectProposals,
  addProjectFeedback,
  getProjectFeedback,
  analyzeProjectProposal,
  generateReviewProposal,
  generateProjectHealth,
  generateFeedbackDraft,
  getProjectMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getProjectEvidence,
  validateEvidence,
  getRubricCriteria,
};
