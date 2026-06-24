import Project from "../../models/project.model.js";
import Group from "../../models/group.model.js";
import User from "../../models/user.model.js";
import File from "../../models/file.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";
import Feature from "../../models/feature.model.js";
import Milestone from "../../models/milestone.model.js";
import RubricCriteria from "../../models/rubricCriteria.model.js";
import { syncMilestoneStatus } from "../projects/governance.service.js";

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

export const reviewProposal = async ({
  projectId,
  approve,
  feedbackMessage,
  reviewerId,
}) => {
  const [project, supervisor] = await Promise.all([
    Project.findById(projectId).populate("group"),
    User.findById(reviewerId),
  ]);

  const isSupervisor = supervisor.role === "teacher";
  if (!isSupervisor) throw new ApiError(403, "Only supervisors can review");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group.supervisor.equals(supervisor._id))
    throw new ApiError(403, "You are not assigned to this project");
  if (!["submitted", "under_review"].includes(project.status))
    throw new ApiError(400, "Project cannot be reviewed in its current status");

  project.status = approve ? "approved" : "rejected";

  if (feedbackMessage) {
    project.feedback.push({
      supervisorId: reviewerId,
      type: approve ? "positive" : "negative",
      title: approve ? "Proposal Approved" : "Proposal Rejected",
      message: feedbackMessage,
      priority: "medium",
      source: "review_decision",
    });
  }

  await project.save();

  await notificationService.createNotification({
    user: project.group.leader,
    message: approve ? `Congratulations! Your project proposal "${project.title}" was approved. You may now proceed with development.` : `Attention: Your project proposal "${project.title}" was rejected. Please review the feedback and submit revisions.`,
    type: approve ? "approval" : "rejection",
    priority: "high",
  });

  return project;
};

export const approveProject = async ({
  projectId,
  reviewerId,
  feedbackMessage,
}) => reviewProposal({ projectId, approve: true, reviewerId, feedbackMessage });

export const rejectProject = async ({
  projectId,
  reviewerId,
  feedbackMessage,
}) =>
  reviewProposal({ projectId, approve: false, reviewerId, feedbackMessage });

export const getProjectProposals = async (
  teacherId,
  { status = "submitted" } = {},
) => {
  const groups = await Group.find({ supervisor: teacherId }).select("_id");
  const groupIds = groups.map((g) => g._id);

  const allowedStatuses = [
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "in_progress",
    "completed",
  ];

  const normalizedStatus = String(status || "submitted").toLowerCase();
  if (normalizedStatus !== "all" && !allowedStatuses.includes(normalizedStatus)) {
    throw new ApiError(400, "Invalid project status filter");
  }

  const query = {
    group: { $in: groupIds },
  };

  if (normalizedStatus !== "all") {
    query.status = normalizedStatus;
  }

  const proposals = await Project.find(query)
    .populate({
      path: "group",
      select: "name leader members department semester",
      populate: [
        { path: "leader", select: "name email" },
        { path: "members.user", select: "name email" },
      ],
    })
    .sort({ createdAt: -1 });

  return proposals;
};

export const addProjectFeedback = async ({
  projectId,
  teacherId,
  type,
  title,
  message,
  priority,
  attachments = [],
  featureIds = [],
}) => {
  const [project, teacher] = await Promise.all([
    Project.findById(projectId).populate("group"),
    User.findById(teacherId),
  ]);

  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(403, "Only supervisors can add feedback");
  }
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not assigned to this project");
  }
  if (!message) {
    throw new ApiError(400, "Feedback message is required");
  }

  const normalizedFeatureIds = [...new Set((featureIds || []).map(String))];
  let validatedFeatureIds = [];

  if (normalizedFeatureIds.length > 0) {
    const features = await Feature.find({
      _id: { $in: normalizedFeatureIds },
      group: project.group._id,
    }).select("_id");

    if (features.length !== normalizedFeatureIds.length) {
      throw new ApiError(400, "One or more selected features are invalid for this project group");
    }

    validatedFeatureIds = features.map((feature) => feature._id);
  }

  const newFeedback = {
    supervisorId: teacherId,
    type,
    title,
    message,
    priority: priority || "medium",
    relatedFeatures: validatedFeatureIds,
    source: "supervisor_feedback",
  };

  if (Array.isArray(attachments) && attachments.length > 0) {
    const fileDocs = await File.insertMany(
      attachments.map((a) => ({
        category: "project_attachment",
        relatedEntity: project._id,
        relatedModel: "Project",
        uploadedBy: teacherId,
        fileUrl: a.fileUrl,
        metadata: {
          originalName: a.originalName,
          fileType: a.fileType,
        },
      })),
    );
    newFeedback.attachments = fileDocs.map((f) => f._id);
  }

  project.feedback.push(newFeedback);

  await project.save();
  const feedback = project.feedback[project.feedback.length - 1];

  await notificationService.createNotification({
    user: project.group.leader,
    message: `Action Required: New supervisor feedback was added to your project "${project.title}". Please review it and incorporate the changes.`,
    type: "feedback",
    link: `/student/projects/${project._id}/feedback`,
    priority: "medium",
  });

  return normalizeProjectFeedback({
    ...feedback.toObject(),
    supervisorId: {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
    },
  });
};

export const getProjectFeedback = async (teacherId, projectId) => {
  const [project, teacher] = await Promise.all([
    Project.findById(projectId)
      .populate("group")
      .populate("feedback.supervisorId", "name email role")
      .populate("feedback.relatedFeatures", "name description implementedBy createdAt")
      .populate("feedback.attachments"),
    User.findById(teacherId),
  ]);

  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(403, "Only supervisors can view feedback");
  }
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not assigned to this project");
  }

  const feedback = Array.isArray(project.feedback)
    ? project.feedback
        .map((item) => normalizeProjectFeedback(item))
        .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
    : [];

  return feedback;
};

export const getProjectEvidence = async (teacherId, projectId) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }
  return project.evidenceRegistry;
};

export const validateEvidence = async (teacherId, projectId, evidenceId, { status, note }) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  const evidence = project.evidenceRegistry.id(evidenceId);
  if (!evidence) throw new ApiError(404, "Evidence not found");

  evidence.validationStatus = status;
  evidence.validationNote = note;
  evidence.validatedBy = teacherId;

  await project.save();
  await syncMilestoneStatus(projectId);
  return evidence;
};

export const createMilestone = async (teacherId, projectId, milestoneData) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  // Verify criteriaKeys exist
  const criteria = await RubricCriteria.find({ key: { $in: milestoneData.criteriaKeys } });
  if (criteria.length !== milestoneData.criteriaKeys.length) {
    throw new ApiError(400, "One or more invalid rubric criteria keys provided");
  }

  const milestone = await Milestone.create({
    project: projectId,
    ...milestoneData,
  });

  return milestone;
};

export const updateMilestone = async (teacherId, milestoneId, update) => {
  const milestone = await Milestone.findById(milestoneId).populate({
    path: "project",
    populate: { path: "group" },
  });

  if (!milestone) throw new ApiError(404, "Milestone not found");
  if (!milestone.project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  Object.assign(milestone, update);
  if (update.status === "completed") {
    milestone.completedAt = new Date();
  }

  await milestone.save();
  return milestone;
};

export const getProjectMilestones = async (teacherId, projectId) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  return Milestone.find({ project: projectId })
    .sort({ order: 1, dueDate: 1 })
    .lean();
};

export const deleteMilestone = async (teacherId, projectId, milestoneId) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group?.supervisor?.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }

  const milestone = await Milestone.findByIdAndDelete(milestoneId);
  if (!milestone) throw new ApiError(404, "Milestone not found");

  // Re-sync after removal
  await syncMilestoneStatus(projectId);
  return { success: true };
};

