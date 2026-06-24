import express from "express";
import chatController from "../controllers/chat.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Role-specific AI Chat endpoint
router.post("/", authMiddleware, chatController.processMessage);
router.get("/history", authMiddleware, chatController.getHistory);
router.delete("/history", authMiddleware, chatController.clearHistory);

export default router;
