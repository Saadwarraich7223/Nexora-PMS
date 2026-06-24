import mongoose from "mongoose";

const completionAuditSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decision: {
      type: String,
      enum: ["allow", "deny"],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    checks: [
      {
        key: { type: String, required: true },
        passed: { type: Boolean, required: true },
        expected: { type: mongoose.Schema.Types.Mixed, default: null },
        actual: { type: mongoose.Schema.Types.Mixed, default: null },
        message: { type: String, trim: true, default: "" },
      },
    ],
    readinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true },
);

completionAuditSchema.index({ project: 1, createdAt: -1 });

const CompletionAudit = mongoose.model("CompletionAudit", completionAuditSchema);

export default CompletionAudit;
