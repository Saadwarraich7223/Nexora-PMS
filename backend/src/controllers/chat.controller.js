import chatService from "../services/chat.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ChatHistory from "../models/chatHistory.model.js";

const processMessage = asyncHandler(async (req, res) => {
  const { message, history: clientHistory } = req.body;
  const { _id: userId, role } = req.user;

  const response = await chatService.processChatQuery(userId, role, message, clientHistory);

  // Persist the conversation
  try {
    let historyDoc = await ChatHistory.findOne({ user: userId, role });
    if (!historyDoc) {
      historyDoc = new ChatHistory({ user: userId, role, messages: [] });
    }
    
    historyDoc.messages.push({ role: "user", content: message });
    historyDoc.messages.push({ role: "assistant", content: response });
    historyDoc.lastMessageAt = Date.now();
    
    // Keep only last 50 messages to prevent document bloat
    if (historyDoc.messages.length > 50) {
      historyDoc.messages = historyDoc.messages.slice(-50);
    }
    
    await historyDoc.save();
  } catch (err) {
    console.error("Failed to save chat history:", err);
  }

  res.send({
    success: true,
    data: {
      response,
    },
  });
});

const getHistory = asyncHandler(async (req, res) => {
  const { _id: userId, role } = req.user;

  const historyDoc = await ChatHistory.findOne({ user: userId, role }).lean();

  res.send({
    success: true,
    data: {
      history: historyDoc ? historyDoc.messages : [],
    },
  });
});

const clearHistory = asyncHandler(async (req, res) => {
  const { _id: userId, role } = req.user;

  await ChatHistory.deleteOne({ user: userId, role });

  res.send({
    success: true,
    message: "Chat history cleared successfully",
  });
});

const chatController = {
  processMessage,
  getHistory,
  clearHistory,
};

export default chatController;
export { processMessage };
