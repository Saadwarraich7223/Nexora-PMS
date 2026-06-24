import asyncHandler from "../../utils/asyncHandler.js";
import * as notificationService from "../../services/notification.service.js";

const createBroadcast = asyncHandler(async (req, res) => {
  const result = await notificationService.createBroadcastNotification({
    title: req.body.title,
    message: req.body.message,
    priority: req.body.priority,
    link: req.body.link,
    targetRoles: req.body.targetRoles,
    department: req.body.department,
    semester: req.body.semester,
    createdBy: req.user._id,
  });

  res.status(201).json({
    message: "Broadcast notification sent",
    broadcast: result.broadcast,
    recipients: result.recipients,
  });
});

const listBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await notificationService.listBroadcastNotifications(req.query, req.user);
  res.json({ broadcasts, announcements: broadcasts });
});

const deleteBroadcast = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteBroadcastNotification(req.params.id);
  res.json({ message: "Broadcast notification deleted", result });
});

export { createBroadcast, listBroadcasts, deleteBroadcast };
