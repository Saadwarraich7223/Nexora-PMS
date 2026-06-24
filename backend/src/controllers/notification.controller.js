import asyncHandler from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";

const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { notifications, pagination } =
    await notificationService.getNotificationsPaginated(req.user._id, {
      page,
      limit,
    });

  res.json({
    message: "Notifications fetched successfully",
    count: notifications.length,
    notifications,
    pagination,
  });
});

const getBroadcasts = asyncHandler(async (req, res) => {
  const broadcasts = await notificationService.listBroadcastNotifications(
    req.query,
    req.user,
  );
  res.json({ broadcasts, announcements: broadcasts });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(
    req.params.id,
    req.user._id,
  );
  res.json({ message: "Notification marked as read", notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  res.json({ message: "All notifications marked as read" });
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  res.json({ message: "Notification deleted successfully" });
});

export { getNotifications, getBroadcasts, markAsRead, markAllAsRead, deleteNotification };
