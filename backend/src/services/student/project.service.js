import Group from "../../models/group.model.js";
import Project from "../../models/project.model.js";
import File from "../../models/file.model.js";
import Evaluation from "../../models/evaluation.model.js";
import GradeChallenge from "../../models/gradeChallenge.model.js";
import RubricCriteria from "../../models/rubricCriteria.model.js";
import { syncMilestoneStatus } from "../projects/governance.service.js";
import Milestone from "../../models/milestone.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";
import { analyzeProposalAI } from "../ai.service.js";
import { logger } from '../../utils/logger.js';


const toTimestamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return date.getTime();
};

const normalizeProjectFeedback = (item) => ({
  _id: item._id,
  source: item.source || "supervisor_feedback",
  type: item.type,
  title: item.title,
  message: item.message,
  priority: item.priority,
  attachments: (item.attachments || []).map((a) => (typeof a === "object" ? a : { _id: a })),
  relatedFeatures: item.relatedFeatures || [],
  createdBy: item.supervisorId || null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const analyzeProposal = (description) => {
  const text = description.toLowerCase();
  const wordCount = description.trim().split(/\s+/).length;

  const archKeywords = [
    "architecture",
    "system design",
    "diagram",
    "mvc",
    "microservices",
    "uml",
    "flowchart",
  ];
  const techKeywords = [
    "tech stack",
    "technologies",
    "frontend",
    "backend",
    "database",
    "react",
    "node",
    "mongo",
    "sql",
  ];
  const problemKeywords = [
    "problem statement",
    "issue",
    "challenge",
    "problem",
    "difficult",
    "current system",
  ];
  const solutionKeywords = [
    "proposed solution",
    "solution",
    "propose",
    "resolve",
    "address",
  ];
  const outcomesKeywords = [
    "expected outcomes",
    "outcome",
    "deliverable",
    "milestone",
    "result",
    "future",
  ];

  const hasArchitecture = archKeywords.some((kw) => text.includes(kw));
  const hasTechStack = techKeywords.some((kw) => text.includes(kw));
  const hasProblemStatement = problemKeywords.some((kw) => text.includes(kw));
  const hasSolution = solutionKeywords.some((kw) => text.includes(kw));
  const hasOutcomes = outcomesKeywords.some((kw) => text.includes(kw));

  let score = 100;
  let recs = [];

  if (wordCount < 100) {
    score -= 20;
    recs.push("Description is too brief. Expand on the problem and solution.");
  } else if (wordCount > 1000) {
    score -= 10;
    recs.push("Description is very long. Consider keeping it concise.");
  }

  if (!hasProblemStatement) {
    score -= 15;
    recs.push("Missing a clear problem statement.");
  }
  if (!hasSolution) {
    score -= 15;
    recs.push("Missing the proposed solution logic.");
  }
  if (!hasArchitecture) {
    score -= 15;
    recs.push("Missing architecture details.");
  }
  if (!hasTechStack) {
    score -= 15;
    recs.push("Missing technical stack details.");
  }
  if (!hasOutcomes) {
    score -= 10;
    recs.push("Missing expected outcomes or deliverables.");
  }

  return {
    wordCount,
    hasProblemStatement,
    hasSolution,
    hasArchitecture,
    hasTechStack,
    hasOutcomes,
    score: Math.max(0, score),
    recommendation:
      recs.length > 0
        ? recs.join(" ")
        : "Proposal looks exceptionally well-structured.",
  };
};

export const submitProposal = async ({ title, description, files, user }) => {
  const group = await Group.findById(user.activeGroup);
  if (!group) throw new ApiError(404, "Group not found");
  if (!group.leader.equals(user._id)) {
    throw new ApiError(403, "Only group leader can submit a proposal");
  }
  if (group.status !== "active") {
    logger.info("group.status:", group.status);
    throw new ApiError(400, "Only approved groups can submit proposals");
  }

  if (!group.supervisor) {
    logger.info("No SOOP");
    throw new ApiError(400, "Supervisor must be assigned");
  }

  const existing = await Project.findOne({
    group: group._id,
    status: {
      $in: [
        "submitted",
        "under_review",
        "approved",
        "in_progress",
        "completed",
      ],
    },
  });

  if (existing) {
    throw new ApiError(409, "Proposal already submitted");
  }

  const analysis = analyzeProposal(description);

  // Create project first to get ID
  const project = new Project({
    group: group._id,
    title,
    description,
    status: "submitted",
    analysis,
  });

  // Create File documents for each file
  if (Array.isArray(files) && files.length > 0) {
    const fileDocs = await File.insertMany(
      files.map((f) => ({
        category: "project_attachment",
        relatedEntity: project._id,
        relatedModel: "Project",
        uploadedBy: user._id,
        fileUrl: f.fileUrl,
        metadata: {
          originalName: f.originalName,
          fileType: f.fileType,
          category: f.category || "other",
        },
      })),
    );
    project.files = fileDocs.map((f) => f._id);
  }

  await project.save();

  group.project = project._id;
  await group.save();

  await notificationService.createNotification({
    user: group.supervisor,
    message: `A new project proposal "${title}" has been submitted by group ${group.name}`,
    type: "project",
    link: `/teacher/projects/proposals`,
    priority: "medium",
  });

  // Fire-and-forget: upgrade to AI analysis in the background
  analyzeProposalAI(title, description)
    .then((aiResult) => {
      Project.findByIdAndUpdate(project._id, { analysis: aiResult }).catch(
        (err) => logger.error("AI analysis save failed:", err),
      );
    })
    .catch((err) =>
      logger.error(
        "AI analysis unavailable, keyword analysis kept:",
        err.message,
      ),
    );

  return project;
};

export const getMyProject = async (user) => {
  if (!user.activeGroup) {
    throw new ApiError(400, "You have no active group");
  }

  const project = await Project.findOne({ group: user.activeGroup })
    .populate("files")
    .populate("feedback.attachments")
    .populate("evidenceRegistry.value"); // If evidence holds file references
  if (!project) throw new ApiError(404, "Project not found");

  return project;
};

export const deleteMyProject = async (user) => {
  const group = await Group.findById(user.activeGroup);
  if (!group) throw new ApiError(404, "Group not found");
  const project = await Project.findById(group.project);
  if (!project) throw new ApiError(404, "Project not found");

  if (!group.leader.equals(user._id))
    throw new ApiError(403, "You are not the leader of this group");

  if (project.status !== "rejected" && project.status !== "draft")
    throw new ApiError(400, "Project cannot be deleted in its current status");

  await project.deleteOne();
  group.project = null;
  await group.save();
  return project;
};

export const getProjectFeedback = async (user, projectId) => {
  if (!user.activeGroup) {
    throw new ApiError(400, "You have no active group");
  }

  const project = await Project.findOne({
    _id: projectId,
    group: user.activeGroup,
  })
    .populate("feedback.supervisorId", "name email role")
    .populate("feedback.relatedFeatures", "name description implementedBy createdAt");
  if (!project) throw new ApiError(404, "Project not found");

  const feedback = Array.isArray(project.feedback)
    ? project.feedback
        .map((item) => normalizeProjectFeedback(item))
        .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    : [];

  return feedback;
};

export const submitGradeChallenge = async (user, projectId, payload) => {
  if (!user.activeGroup) {
    throw new ApiError(400, "You have no active group");
  }

  const project = await Project.findOne({
    _id: projectId,
    group: user.activeGroup,
  }).select("_id group");
  if (!project) throw new ApiError(404, "Project not found");

  const evaluation = await Evaluation.findOne({
    project: project._id,
    status: "published",
  }).select("_id status");
  if (!evaluation) {
    throw new ApiError(
      400,
      "Published evaluation is required before submitting a challenge",
    );
  }

  const reason = String(payload?.reason || "").trim();
  if (!reason) {
    throw new ApiError(400, "Challenge reason is required");
  }

  const challenge = await GradeChallenge.create({
    project: project._id,
    evaluation: evaluation._id,
    group: user.activeGroup,
    submittedBy: user._id,
    reason,
    evidence: Array.isArray(payload?.evidence) ? payload.evidence : [],
  });

  // Log activity on evaluation
  const evaluationDoc = await Evaluation.findById(evaluation._id);
  if (evaluationDoc) {
    evaluationDoc.activities.push({
      type: "challenge_submitted",
      status: evaluationDoc.status,
      actor: user._id,
      timestamp: new Date(),
      note: `Grade challenge submitted: ${reason.substring(0, 50)}...`,
      metadata: { challengeId: challenge._id },
    });
    await evaluationDoc.save();
  }

  return challenge;
};

export const getMyGroupGradeChallenges = async (user, projectId) => {
  if (!user.activeGroup) {
    throw new ApiError(400, "You have no active group");
  }

  const project = await Project.findOne({
    _id: projectId,
    group: user.activeGroup,
  }).select("_id");
  if (!project) throw new ApiError(404, "Project not found");

  return GradeChallenge.find({
    group: user.activeGroup,
    project: project._id,
  })
    .populate("submittedBy", "name email")
    .populate("resolution.decidedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

export const getProjectEvidence = async (user, projectId) => {
  if (!user.activeGroup) throw new ApiError(400, "No active group");
  const project = await Project.findOne({
    _id: projectId,
    group: user.activeGroup,
  })
    .select("evidenceRegistry")
    .lean();
  if (!project) throw new ApiError(404, "Project not found");
  return project.evidenceRegistry;
};

export const submitEvidence = async (
  user,
  projectId,
  { criterionKey, value, file },
) => {
  if (!user.activeGroup) throw new ApiError(400, "No active group");
  const project = await Project.findOne({
    _id: projectId,
    group: user.activeGroup,
  });
  if (!project) throw new ApiError(404, "Project not found");

  const criterion = await RubricCriteria.findOne({
    key: criterionKey,
    isActive: true,
  });
  if (!criterion) throw new ApiError(404, "Invalid or inactive criterion");

  if (criterion.evidenceType === "automated") {
    throw new ApiError(400, "Automated criteria cannot be manually submitted");
  }

  // Derive the type from the criterion's evidenceType
  // criterion.evidenceType is ["file", "link"]
  // project.evidenceRegistry[].type expect ["file", "link", "metric"]
  const evidenceType = criterion.evidenceType;

  const finalValue = file ? file.fileUrl : value;
  if (!finalValue)
    throw new ApiError(400, "Evidence value or file is required");

  // Check if already exists, then update or push
  const existingIdx = project.evidenceRegistry.findIndex(
    (e) => e.criterionKey === criterionKey,
  );
  const evidenceData = {
    criterionKey,
    type: evidenceType,
    value: finalValue,
    originalName: file?.originalName || null,
    fileType: file?.fileType || null,
    providedAt: new Date(),
    validationStatus: "pending",
  };

  if (existingIdx > -1) {
    project.evidenceRegistry[existingIdx] = {
      ...project.evidenceRegistry[existingIdx],
      ...evidenceData,
    };
  } else {
    project.evidenceRegistry.push(evidenceData);
  }

  await project.save();
  await syncMilestoneStatus(projectId);
  return evidenceData;
};

export const getProjectMilestones = async (user, projectId) => {
  if (!user.activeGroup) throw new ApiError(400, "No active group");
  const project = await Project.findOne({
    _id: projectId,
    group: user.activeGroup,
  }).select("_id");
  if (!project) throw new ApiError(404, "Project not found");

  return Milestone.find({ project: project._id })
    .sort({ order: 1, dueDate: 1 })
    .lean();
};
