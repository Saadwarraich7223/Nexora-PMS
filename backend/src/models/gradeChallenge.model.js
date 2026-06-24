import mongoose from "mongoose";

const gradeChallengeSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    evaluation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evaluation",
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    evidence: [
      {
        label: { type: String, trim: true, default: "" },
        value: { type: String, trim: true, default: "" },
      },
    ],
    resolution: {
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      note: { type: String, trim: true, maxlength: 1000, default: "" },
      decidedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

gradeChallengeSchema.index({ project: 1, submittedBy: 1, createdAt: -1 });

const GradeChallenge = mongoose.model("GradeChallenge", gradeChallengeSchema);

export default GradeChallenge;
