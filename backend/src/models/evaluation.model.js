import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";

/**
 * Final Evaluation model.
 * Stores teacher's final assessment for a project/group with
 * group-level weighted grade + individual member contribution grades.
 */

const memberGradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: 100 },
    breakdown: {
      featuresImplemented: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      meetingAttendance: { type: Number, default: 0 },
      githubCommits: { type: Number, default: 0 },
    },
    teacherAdjustment: { type: Number, default: 0 },
    teacherNote: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false },
);

const evaluationSchema = new mongoose.Schema(
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
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ─── Group-Level Grade ───────────────────────────────────────────────────
    groupGrade: {
      score: { type: Number, default: null },
      maxScore: { type: Number, default: 100 },
      breakdown: {
        deadlinePerformance: { type: Number, default: 0 },
        featureCompletion: { type: Number, default: 0 },
        taskCompletion: { type: Number, default: 0 },
        meetingEngagement: { type: Number, default: 0 },
        codeContribution: { type: Number, default: 0 },
        proposalQuality: { type: Number, default: 0 },
      },
      teacherAdjustment: { type: Number, default: 0 },
      teacherNote: { type: String, trim: true, maxlength: 500, default: "" },
    },

    // ─── Individual Member Grades ────────────────────────────────────────────
    memberGrades: [memberGradeSchema],

    // ─── Lifecycle ───────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "pending_second_review", "published"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    moderation: {
      required: { type: Boolean, default: false },
      secondReviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      requestedAt: { type: Date, default: null },
      decision: {
        type: String,
        enum: ["pending", "approved", "rejected", null],
        default: null,
      },
      decisionNote: { type: String, trim: true, maxlength: 500, default: "" },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      decidedAt: { type: Date, default: null },
    },
    // ─── Lifecycle History ───────────────────────────────────────────────────
    activities: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            "draft_saved",
            "published",
            "second_review_requested",
            "moderation_decision",
            "challenge_submitted",
            "challenge_resolved",
          ],
        },
        status: { type: String, required: true },
        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, trim: true, maxlength: 500, default: "" },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
  },
  { timestamps: true },
);

// One evaluation per project
evaluationSchema.index({ project: 1 }, { unique: true });

// Once published, evaluation is immutable through direct document saves.
evaluationSchema.pre("save", async function protectPublishedMutation(next) {
  if (this.isNew) return next();

  if (this.status === "published" && this.isModified()) {
    const original = await this.constructor
      .findById(this._id)
      .select("status")
      .lean();

    if (original?.status === "published") {
      return next(
        new ApiError(
          400,
          "Published evaluations are immutable and cannot be modified",
        ),
      );
    }
  }

  return next();
});

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;
