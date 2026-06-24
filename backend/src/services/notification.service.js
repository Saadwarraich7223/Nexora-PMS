import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import { buildPaginationMeta, normalizePagination } from "../utils/pagination.js";
import { getIO } from "../sockets/index.js";
import mongoose from "mongoose";

const buildBroadcastAudienceFilter = ({ targetRoles, department, semester }) => {
  const filter = {};
  if (Array.isArray(targetRoles) && targetRoles.length > 0) {
    filter.role = { $in: targetRoles };
  }
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  return filter;
};

export const createNotification = async ({
  user,
  title = null,
  message,
  type = "general",
  link = null,
  priority = "low",
  broadcast = false,
  broadcastId = null,
  broadcastCreatedBy = null,
  targetRoles = [],
  department = null,
  semester = null,
}) => {
  const notification = await Notification.create({
    user,
    title,
    message,
    type,
    link,
    priority,
    broadcast,
    broadcastId,
    broadcastCreatedBy,
    targetRoles,
    department,
    semester,
  });

  const io = getIO();
  if (io) {
    io.of("/notifications").to(String(user)).emit("notification:new", notification);
  }

  return notification;
};

export const createBroadcastNotification = async ({
  title,
  message,
  priority = "low",
  link = null,
  targetRoles = [],
  department = null,
  semester = null,
  createdBy,
}) => {
  if (!title || !message) {
    throw new ApiError(400, "Title and message are required");
  }
  if (!createdBy) {
    throw new ApiError(400, "User ID is required");
  }

  const audienceFilter = buildBroadcastAudienceFilter({
    targetRoles,
    department,
    semester,
  });
  const users = await User.find(audienceFilter).select("_id").lean();
  if (users.length === 0) {
    throw new ApiError(404, "No users found for this audience");
  }

  const broadcastId = new mongoose.Types.ObjectId();
  const notifications = users.map((user) => ({
    user: user._id,
    title,
    message,
    type: "announcement",
    priority,
    link,
    broadcast: true,
    broadcastId,
    broadcastCreatedBy: createdBy,
    targetRoles,
    department,
    semester,
  }));

  const created = await Notification.insertMany(notifications);

  const io = getIO();
  if (io) {
    created.forEach((notification) => {
      io.of("/notifications")
        .to(String(notification.user))
        .emit("notification:new", notification);
    });
  }

  return {
    broadcast: {
      _id: broadcastId,
      title,
      message,
      priority,
      link,
      targetRoles,
      department,
      semester,
      broadcast: true,
      createdBy,
      createdAt: created[0]?.createdAt || new Date(),
      updatedAt: created[0]?.updatedAt || new Date(),
      recipients: users.length,
      readCount: 0,
    },
    recipients: users.length,
  };
};

export const listBroadcastNotifications = async (query = {}, viewer = null) => {
  const match = { broadcast: true };
  if (query.role) match.targetRoles = query.role;
  if (query.department) match.department = query.department;
  if (query.semester) match.semester = Number(query.semester);

  if (viewer && viewer.role !== "admin") {
    match.$and = [
      {
        $or: [
          { targetRoles: { $exists: false } },
          { targetRoles: { $size: 0 } },
          { targetRoles: viewer.role },
        ],
      },
      {
        $or: [
          { department: null },
          { department: { $exists: false } },
          { department: viewer.department },
        ],
      },
      {
        $or: [
          { semester: null },
          { semester: { $exists: false } },
          { semester: viewer.semester },
        ],
      },
    ];
  }

  const rows = await Notification.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$broadcastId",
        title: { $first: "$title" },
        message: { $first: "$message" },
        priority: { $first: "$priority" },
        link: { $first: "$link" },
        targetRoles: { $first: "$targetRoles" },
        department: { $first: "$department" },
        semester: { $first: "$semester" },
        createdBy: { $first: "$broadcastCreatedBy" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        recipients: { $sum: 1 },
        readCount: {
          $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] },
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return rows.map((row) => ({ ...row, broadcast: true }));
};

export const deleteBroadcastNotification = async (broadcastId) => {
  const result = await Notification.deleteMany({
    broadcast: true,
    broadcastId,
  });
  if (result.deletedCount === 0) {
    throw new ApiError(404, "Broadcast notification not found");
  }
  return { deleted: true, deletedCount: result.deletedCount };
};

export const getNotifications = async (userId) => {
  return await Notification.find({ user: userId })
    .populate("broadcastCreatedBy", "name role")
    .sort({ createdAt: -1 });
};

export const getNotificationsPaginated = async (userId, { page, limit } = {}) => {
  const filter = { user: userId };
  const shouldPaginate = page !== undefined || limit !== undefined;

  if (!shouldPaginate) {
    const notifications = await Notification.find(filter)
      .populate("broadcastCreatedBy", "name role")
      .sort({ createdAt: -1 });

    return {
      notifications,
      pagination: buildPaginationMeta({
        total: notifications.length,
        page: 1,
        limit: notifications.length || 1,
      }),
    };
  }

  const pagination = normalizePagination({ page, limit, defaultLimit: 25 });

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate("broadcastCreatedBy", "name role")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

export const createNotificationsBulk = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  return await Notification.insertMany(notifications);
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true },
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  return notification;
};

export const markAllAsRead = async (userId) => {
  return await Notification.updateMany({ user: userId }, { isRead: true });
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });
  if (!notification) throw new ApiError(404, "Notification not found");
  return notification;
};
