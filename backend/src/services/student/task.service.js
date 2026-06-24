import Task from "../../models/task.model.js";
import Group from "../../models/group.model.js";
import File from "../../models/file.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";
import { buildPaginationMeta, normalizePagination } from "../../utils/pagination.js";
import { logger } from '../../utils/logger.js';


const ensureTaskResourceMutationAccess = ({ group, task, userId }) => {
  const isLeader = String(group.leader) === String(userId);
  const isTaskOwner = task.assignedTo && String(task.assignedTo) === String(userId);

  if (!isLeader && !isTaskOwner) {
    throw new ApiError(
      403,
      "You can only manage resources for your own assigned tasks unless you are the group leader",
    );
  }
};

const createTask = async (groupId, userId, payload) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (!group.leader.equals(userId)) {
    throw new ApiError(403, "Only the group leader can create tasks");
  }

  if (payload.assignedTo) {
    const isMember = group.members.some(
      (m) => String(m.user) === String(payload.assignedTo),
    );
    if (!isMember) {
      throw new ApiError(400, "Assigned user is not a member of this group");
    }
  }

  if (payload.linkedResources && payload.linkedResources.length > 0) {
    const resources = await File.find({
      _id: { $in: payload.linkedResources },
      category: "group_resource",
      relatedEntity: groupId,
    });
    if (resources.length !== payload.linkedResources.length) {
      throw new ApiError(400, "One or more linked resources are invalid");
    }
  }

  if (payload.dependencies && payload.dependencies.length > 0) {
    const deps = await Task.find({
      _id: { $in: payload.dependencies },
      group: groupId,
    });
    if (deps.length !== payload.dependencies.length) {
      throw new ApiError(400, "One or more dependencies are invalid");
    }
  }

  const task = await Task.create({
    ...payload,
    group: groupId,
    createdBy: userId,
  });

  if (task.linkedResources?.length > 0) {
    await File.updateMany(
      { _id: { $in: task.linkedResources }, category: "group_resource", relatedEntity: groupId },
      { $addToSet: { "metadata.linkedTasks": task._id } },
    );
  }

  if (task.assignedTo) {
    await notificationService.createNotification({
      user: task.assignedTo,
      message: `Action Required: You have been assigned a new task: "${task.title}". Please review it and begin work.`,
      type: "task",
      priority: task.priority || "low",
    });
  }

  return task;
};

const getGroupTasks = async (groupId, { page, limit, type } = {}) => {
  const filter = { group: groupId };
  if (type) filter.type = type;
  const shouldPaginate = page !== undefined || limit !== undefined;

  if (!shouldPaginate) {
    const tasks = await Task.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("linkedResources", "originalName fileUrl uploadedBy")
      .populate("dependencies", "title status priority")
      .sort({ createdAt: -1 })
      .lean();

    return {
      tasks,
      pagination: buildPaginationMeta({
        total: tasks.length,
        page: 1,
        limit: tasks.length || 1,
      }),
    };
  }

  const pagination = normalizePagination({ page, limit, defaultLimit: 30 });

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("linkedResources", "originalName fileUrl uploadedBy")
      .populate("dependencies", "title status priority")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

const getTaskById = async (taskId, groupId) => {
  const task = await Task.findOne({ _id: taskId, group: groupId })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("linkedResources", "originalName fileUrl uploadedBy")
    .populate("dependencies", "title status priority")
    .lean();
  if (!task) throw new ApiError(404, "Task not found");
  return task;
};

const updateTask = async (taskId, groupId, userId, payload) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const task = await Task.findOne({ _id: taskId, group: groupId });
  if (!task) throw new ApiError(404, "Task not found");

  const isLeader = group.leader.equals(userId);
  const isOwnTask = task.assignedTo && String(task.assignedTo) === String(userId);

  // Leader has full update access. Non-leaders can only move their own assigned task.
  if (!isLeader) {
    if (!isOwnTask) {
      throw new ApiError(403, "You can only update status of your own assigned tasks");
    }

    const allowedForMember = ["status"];
    const providedFields = Object.keys(payload || {}).filter(
      (field) => payload[field] !== undefined,
    );

    const hasInvalidField = providedFields.some(
      (field) => !allowedForMember.includes(field),
    );

    if (hasInvalidField) {
      throw new ApiError(403, "Only task status can be updated by members");
    }
  }

  if (payload.assignedTo !== undefined) {
    if (!isLeader) {
      throw new ApiError(
        403,
        "Only the group leader can assign tasks to members",
      );
    }

    if (payload.assignedTo) {
      const isMember = group.members.some(
        (m) => String(m.user) === String(payload.assignedTo),
      );
      if (!isMember) {
        throw new ApiError(400, "Assigned user is not a member of this group");
      }
    }
  }

  if (payload.linkedResources !== undefined) {
    if (!isLeader) {
      throw new ApiError(403, "Only the group leader can set linked resources directly");
    }

    const normalized = [...new Set((payload.linkedResources || []).map(String))];
    const resources = await File.find({
      _id: { $in: normalized },
      category: "group_resource",
      relatedEntity: groupId,
    });

    if (resources.length !== normalized.length) {
      throw new ApiError(400, "One or more linked resources are invalid");
    }

    const oldIds = (task.linkedResources || []).map((id) => String(id));
    const removed = oldIds.filter((id) => !normalized.includes(id));
    const added = normalized.filter((id) => !oldIds.includes(id));

    task.linkedResources = normalized;

    if (removed.length > 0) {
      await File.updateMany(
        { _id: { $in: removed }, category: "group_resource", relatedEntity: groupId },
        { $pull: { "metadata.linkedTasks": task._id } },
      );
    }
    if (added.length > 0) {
      await File.updateMany(
        { _id: { $in: added }, category: "group_resource", relatedEntity: groupId },
        { $addToSet: { "metadata.linkedTasks": task._id } },
      );
    }
  }

  if (payload.dependencies !== undefined) {
    if (!isLeader) {
      throw new ApiError(403, "Only the group leader can set task dependencies");
    }

    const normalizedDeps = [...new Set((payload.dependencies || []).map(String))];
    const deps = await Task.find({
      _id: { $in: normalizedDeps },
      group: groupId,
    });

    if (deps.length !== normalizedDeps.length) {
      throw new ApiError(400, "One or more dependencies are invalid");
    }
    
    // Prevent self-dependency
    if (normalizedDeps.includes(String(task._id))) {
      throw new ApiError(400, "A task cannot depend on itself");
    }

    task.dependencies = normalizedDeps;
  }

  // Blocking validation
  if (payload.status && ["in-progress", "review", "completed"].includes(payload.status)) {
    const depIds = payload.dependencies !== undefined ? payload.dependencies : task.dependencies;
    if (depIds && depIds.length > 0) {
      const unresolvedDeps = await Task.countDocuments({
        _id: { $in: depIds },
        status: { $ne: "completed" },
      });
      if (unresolvedDeps > 0) {
        throw new ApiError(400, "Cannot change task status: prerequisites are pending");
      }
    }
  }

  const oldAssignedTo = task.assignedTo;
  const oldStatus = task.status;

  const allowedFields = [
    "title",
    "description",
    "assignedTo",
    "priority",
    "deadline",
    "status",
    "attachments",
    "type",
    "parentFeature",
  ];

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) task[field] = payload[field];
  });

  await task.save();

  if (
    payload.assignedTo &&
    String(payload.assignedTo) !== String(oldAssignedTo)
  ) {
    await notificationService.createNotification({
      user: task.assignedTo,
      message: `Action Required: You have been assigned the task: "${task.title}". Please review it and begin work.`,
      type: "task",
      priority: task.priority || "low",
    });
  }

  if (payload.status && payload.status !== oldStatus) {
    await notificationService.createNotification({
      user: task.createdBy,
      message: `Attention: Task "${task.title}" status was updated to ${task.status}. Please verify if further action is needed.`,
      type: "task",
      priority: "low",
    });

    // Integrity Signal: Check for authorship anomalies if a task is completed
    if (payload.status === "completed") {
      // Fire and forget or awaited? Awaiting for now to ensure signal is locked.
      try {
        const integrityService = (await import("../integrity.service.js")).default;
        await integrityService.scanAuthorshipAnomalies(groupId);
      } catch (err) {
        logger.error("Integrity Scan Failed:", err);
      }
    }
  }

  return task;
};

const setTaskResources = async (taskId, groupId, userId, resourceIds = []) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const task = await Task.findOne({ _id: taskId, group: groupId });
  if (!task) throw new ApiError(404, "Task not found");

  ensureTaskResourceMutationAccess({ group, task, userId });

  const normalized = [...new Set((resourceIds || []).map(String))];
  const resources = await File.find({
    _id: { $in: normalized },
    category: "group_resource",
    relatedEntity: groupId,
  });

  if (resources.length !== normalized.length) {
    throw new ApiError(400, "One or more resources are invalid for this group");
  }

  const isLeader = String(group.leader) === String(userId);
  if (!isLeader) {
    const unauthorizedResources = resources.filter(
      (r) => String(r.uploadedBy) !== String(userId)
    );
    if (unauthorizedResources.length > 0) {
      throw new ApiError(403, "You can only link resources that you have personally uploaded.");
    }

    // Retain any existing resources that were uploaded by others (e.g. by the leader)
    // so the student doesn't accidentally unlink them when saving.
    const oldResources = await File.find({
      _id: { $in: task.linkedResources },
      category: "group_resource",
      relatedEntity: groupId,
    });
    
    const otherPeoplesOldResourceIds = oldResources
      .filter((r) => String(r.uploadedBy) !== String(userId))
      .map((r) => String(r._id));
      
    // Combine the user's submitted valid resources with the ones they aren't allowed to touch
    otherPeoplesOldResourceIds.forEach((id) => {
      if (!normalized.includes(id)) {
        normalized.push(id);
      }
    });
  }

  const oldIds = (task.linkedResources || []).map((id) => String(id));
  const removed = oldIds.filter((id) => !normalized.includes(id));
  const added = normalized.filter((id) => !oldIds.includes(id));

  task.linkedResources = normalized;
  await task.save();

  if (removed.length > 0) {
    await File.updateMany(
      { _id: { $in: removed }, category: "group_resource", relatedEntity: groupId },
      { $pull: { "metadata.linkedTasks": task._id } },
    );
  }

  if (added.length > 0) {
    await File.updateMany(
      { _id: { $in: added }, category: "group_resource", relatedEntity: groupId },
      { $addToSet: { "metadata.linkedTasks": task._id } },
    );
  }

  const updated = await Task.findById(task._id)
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .populate("linkedResources", "originalName fileUrl uploadedBy");

  return updated;
};

const deleteTask = async (taskId, userId, groupId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const task = await Task.findOne({ _id: taskId, group: groupId });
  if (!task) throw new ApiError(404, "Task not found");

  const isLeader = String(group.leader) === String(userId);

  if (!isLeader) {
    throw new ApiError(403, "Only the group leader can delete tasks");
  }

  // If this was a feature, clear parentFeature for all child tasks
  if (task.type === "feature") {
    await Task.updateMany(
      { parentFeature: taskId },
      { $unset: { parentFeature: "" } }
    );
  }

  await File.updateMany(
    { "metadata.linkedTasks": taskId, category: "group_resource", relatedEntity: groupId },
    { $pull: { "metadata.linkedTasks": taskId } },
  );

  await task.deleteOne();
  return { deleted: true };
};

export {
  createTask,
  getGroupTasks,
  getTaskById,
  updateTask,
  setTaskResources,
  deleteTask,
};
