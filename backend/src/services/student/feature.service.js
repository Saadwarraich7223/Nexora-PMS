import Feature from "../../models/feature.model.js";
import Task from "../../models/task.model.js";
import Group from "../../models/group.model.js";
import Deadline from "../../models/deadline.model.js";
import ApiError from "../../utils/apiError.js";

// Compute completion delta and status for a deadline when its linked feature completes.
const _syncDeadlineCompletion = async (featureId, completedAt) => {
  const deadlines = await Deadline.find({ linkedFeature: featureId, isOverridden: { $ne: true } });
  for (const deadline of deadlines) {
    if (deadline.completionStatus !== "pending") continue; // already resolved
    const dueDate = new Date(deadline.dueDate);
    const diffMs = dueDate.getTime() - new Date(completedAt).getTime();
    const daysVariance = Math.round(diffMs / (1000 * 60 * 60 * 24));
    let completionStatus;
    if (daysVariance > 0) completionStatus = "completed_early";
    else if (daysVariance === 0) completionStatus = "completed_on_time";
    else completionStatus = "overdue";

    deadline.completedAt = completedAt;
    deadline.daysVariance = daysVariance;
    deadline.completionStatus = completionStatus;
    await deadline.save();
  }
};

const ensureFeatureMutationAccess = (group, userId, actorRole) => {
  const isLeader = String(group.leader) === String(userId);
  const isAdmin = actorRole === "admin";
  if (!isLeader && !isAdmin) {
    throw new ApiError(403, "Only the group leader can manage features");
  }
};

const createFeature = async (groupId, userId, payload, actorRole) => {
  const { name, description, relatedTasks } = payload;

  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  ensureFeatureMutationAccess(group, userId, actorRole);

  // Verify tasks belong to the same group if provided
  if (relatedTasks && relatedTasks.length > 0) {
    const tasks = await Task.find({ _id: { $in: relatedTasks }, group: groupId });
    if (tasks.length !== relatedTasks.length) {
      throw new ApiError(400, "One or more tasks do not exist or belong to another group");
    }
  }

  const feature = await Feature.create({
    name,
    description,
    group: groupId,
    implementedBy: userId,
    relatedTasks: relatedTasks || [],
  });

  return feature;
};

const getGroupFeatures = async (groupId) => {
  const features = await Feature.find({ group: groupId })
    .populate("implementedBy", "name email")
    .populate({
      path: "relatedTasks",
      populate: [
        { path: "createdBy", select: "name email" },
        { path: "assignedTo", select: "name email" },
        { path: "linkedResources", select: "originalName fileUrl uploadedBy" },
      ],
    })
    .lean();
  return features;
};

const updateFeature = async (
  featureId,
  groupId,
  userId,
  payload,
  actorRole,
) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  ensureFeatureMutationAccess(group, userId, actorRole);

  const feature = await Feature.findOne({ _id: featureId, group: groupId });
  if (!feature) throw new ApiError(404, "Feature not found");

  if (payload.name !== undefined) {
    const trimmed = String(payload.name || "").trim();
    if (!trimmed) throw new ApiError(400, "Feature name is required");
    feature.name = trimmed;
  }

  if (payload.description !== undefined) {
    feature.description = String(payload.description || "").trim();
  }

  // Track status transitions with explicit completedAt
  if (payload.status !== undefined) {
    const wasCompleted = feature.status === "completed";
    feature.status = payload.status;
    if (payload.status === "completed" && !wasCompleted) {
      feature.completedAt = new Date();
      // Fire-and-forget: sync any deadlines linked to this feature
      _syncDeadlineCompletion(featureId, feature.completedAt).catch(() => {});
    } else if (payload.status !== "completed") {
      // Reverted from completed — reset
      feature.completedAt = null;
    }
  }

  await feature.save();

  return feature;
};

const attachTaskToFeature = async (featureId, taskId, groupId, userId, actorRole) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  ensureFeatureMutationAccess(group, userId, actorRole);

  const feature = await Feature.findOne({ _id: featureId, group: groupId });
  if (!feature) throw new ApiError(404, "Feature not found");

  const task = await Task.findOne({ _id: taskId, group: groupId });
  if (!task) throw new ApiError(404, "Task not found or doesn't belong to group");

  if (!feature.relatedTasks.includes(taskId)) {
    feature.relatedTasks.push(taskId);
    await feature.save();
  }

  return feature;
};

const detachTaskFromFeature = async (featureId, taskId, groupId, userId, actorRole) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  ensureFeatureMutationAccess(group, userId, actorRole);

  const feature = await Feature.findOne({ _id: featureId, group: groupId });
  if (!feature) throw new ApiError(404, "Feature not found");

  feature.relatedTasks = feature.relatedTasks.filter(id => String(id) !== String(taskId));
  await feature.save();

  return feature;
};

const deleteFeature = async (featureId, userId, groupId, actorRole) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  ensureFeatureMutationAccess(group, userId, actorRole);

  const feature = await Feature.findOne({ _id: featureId, group: groupId });
  if (!feature) throw new ApiError(404, "Feature not found");

  await feature.deleteOne();
  return { deleted: true };
};

export {
  createFeature,
  getGroupFeatures,
  updateFeature,
  attachTaskToFeature,
  detachTaskFromFeature,
  deleteFeature,
};


