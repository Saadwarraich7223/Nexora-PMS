import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Deadline name is required"],
      trim: true,
      maxlength: [100, "Deadline name cannot exceed 100 characters"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },

    // ─── Feature link ───────────────────────────────────────────────
    linkedFeature: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feature",
      default: null,
    },

    // ─── System-computed completion ───────────────────────────────────────────
    completionStatus: {
      type: String,
      enum: ["pending", "completed_early", "completed_on_time", "overdue"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Positive = completed N days early. Negative = N days overdue.
    daysVariance: {
      type: Number,
      default: null,
    },

    // ─── Teacher manual override (auditable) ──────────────────────────────────
    isOverridden: {
      type: Boolean,
      default: false,
    },
    overrideStatus: {
      type: String,
      enum: [
        "completed_early",
        "completed_on_time",
        "overdue",
        "pending",
        null,
      ],
      default: null,
    },
    overrideNote: {
      type: String,
      trim: true,
      maxlength: [300, "Override note cannot exceed 300 characters"],
      default: null,
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    overriddenAt: {
      type: Date,
      default: null,
    },

    // ─── Automated Grading ────────────────────────────────────────────────────
    grade: {
      type: Number,
      default: null,
    },
    maxGrade: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true },
);

//indexing or data query optimization
deadlineSchema.index({ dueDate: 1, project: 1, createdBy: 1 });
deadlineSchema.index({ linkedFeature: 1 });

export default mongoose.model("Deadline", deadlineSchema);
