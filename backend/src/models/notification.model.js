import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    title: {
      type: String,
      default: null,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    message: {
      type: String,
      required: true,
      maxlength: [1000, "Notification message cannot exceed 1000 characters"],
    },

    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: [
        "project",
        "feedback",
        "request",
        "system",
        "announcement",
        "approval",
        "rejection",
        "meeting",
        "deadline",
        "task",
        "general",
        "other",
      ],
      default: "general",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
    },
    broadcast: {
      type: Boolean,
      default: false,
    },
    broadcastId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    broadcastCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetRoles: {
      type: [String],
      default: [],
    },
    department: {
      type: String,
      default: null,
    },
    semester: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

//indexing or data query optimization
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ broadcast: 1, broadcastId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
