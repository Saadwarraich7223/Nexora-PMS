import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/broadcasts", notificationController.getBroadcasts);
router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;
