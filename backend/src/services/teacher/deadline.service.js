import Deadline from "../../models/deadline.model.js";
import Project from "../../models/project.model.js";
import Feature from "../../models/feature.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";

const verifyProjectSupervisor = async (projectId, supervisorId) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");

  if (!project.group.supervisor.equals(supervisorId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }
  return project;
};

const createDeadline = async (projectId, supervisorId, payload) => {
  const project = await verifyProjectSupervisor(projectId, supervisorId);

  // Validate optional feature link
  if (payload.linkedFeatureId) {
    const feature = await Feature.findOne({
      _id: payload.linkedFeatureId,
      group: project.group._id,
    });
    if (!feature) throw new ApiError(400, "Linked feature not found in this project's group");
  }

  const deadline = await Deadline.create({
    name: payload.name,
    dueDate: payload.dueDate,
    project: projectId,
    createdBy: supervisorId,
    linkedFeature: payload.linkedFeatureId || null,
  });

  // Notify all group members
  for (const member of project.group.members) {
    await notificationService.createNotification({
      user: member.user,
      message: `Important: A new deadline has been set for your project: "${deadline.name}". Please review and prepare your deliverables.`,
      type: "deadline",
      priority: "high",
    });
  }

  return deadline;
};

const getProjectDeadlines = async (projectId, supervisorId) => {
  await verifyProjectSupervisor(projectId, supervisorId);
  const deadlines = await Deadline.find({ project: projectId })
    .populate("linkedFeature", "name status completedAt")
    .populate("overriddenBy", "name")
    .sort({ dueDate: 1 })
    .lean();
  return deadlines;
};

const deleteDeadline = async (deadlineId, supervisorId) => {
  const deadline = await Deadline.findById(deadlineId);
  if (!deadline) throw new ApiError(404, "Deadline not found");
  await verifyProjectSupervisor(deadline.project, supervisorId);

  await deadline.deleteOne();
  return { deleted: true };
};

/**
 * Teacher manually overrides the computed completion status.
 * The override is stored separately so the system value is preserved for audit.
 */
const overrideDeadlineStatus = async (deadlineId, supervisorId, { overrideStatus, overrideNote, grade, maxGrade }) => {
  const deadline = await Deadline.findById(deadlineId);
  if (!deadline) throw new ApiError(404, "Deadline not found");
  await verifyProjectSupervisor(deadline.project, supervisorId);

  if (overrideStatus !== undefined) {
    const allowed = ["completed_early", "completed_on_time", "overdue", "pending", null];
    if (overrideStatus !== null && !allowed.includes(overrideStatus)) {
      throw new ApiError(400, `overrideStatus must be one of: ${allowed.join(", ")}`);
    }

    deadline.isOverridden = overrideStatus !== null;
    deadline.overrideStatus = overrideStatus;
    deadline.overrideNote = overrideNote ? String(overrideNote).trim().substring(0, 300) : null;
    deadline.overriddenBy = supervisorId;
    deadline.overriddenAt = new Date();
  }

  if (grade !== undefined) {
    deadline.grade = grade === null ? null : Number(grade);
    if (maxGrade !== undefined) {
      deadline.maxGrade = Number(maxGrade);
    }
  }

  await deadline.save();

  return deadline;
};

export { createDeadline, getProjectDeadlines, deleteDeadline, overrideDeadlineStatus };

