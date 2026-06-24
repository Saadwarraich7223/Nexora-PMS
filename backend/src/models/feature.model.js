// Feature ownership tracking for contribution visibility.
// Tracks features and the student who developed them.

import mongoose from "mongoose";

const featureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Feature name is required"],
      trim: true,
    },
    description: {
      type: String,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    implementedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relatedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],

    // ─── Completion tracking ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Feature = mongoose.model("Feature", featureSchema);

export default Feature;
