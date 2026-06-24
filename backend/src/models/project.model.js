import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["suggestion", "issue", "praise", "positive", "negative"],
      default: "suggestion",
    },
    title: {
      type: String,
      maxlength: [200, "Feedback title cannot exceed 200 characters"],
      trim: true,
    },
    message: {
      type: String,
      maxlength: [2000, "Feedback message cannot exceed 2000 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    gradingTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GradingTemplate",
    },
    relatedFeatures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feature",
      },
    ],
    source: {
      type: String,
      enum: ["review_decision", "supervisor_feedback"],
      default: "supervisor_feedback",
    },
  },
  { timestamps: true },
);

const projectSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      maxlength: [200, "Project title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      minlength: [10, "Project description must be atleast 10 characters"],
      maxlength: [4000, "Project description cannot exceed 4000 characters"],
    },
    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "in_progress",
        "completed",
      ],
      default: "draft",
    },
    analysis: {
      wordCount: { type: Number, default: 0 },
      hasArchitecture: { type: Boolean, default: false },
      hasTechStack: { type: Boolean, default: false },
      hasProblemStatement: { type: Boolean, default: false },
      hasSolution: { type: Boolean, default: false },
      hasOutcomes: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
      contextObservation: { type: String, default: "" },
      isDuplicate: { type: Boolean, default: false },
      recommendation: { type: String, default: "" },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      suggestions: [{ type: String }],
      riskFlags: [{ type: String }],
      analyzedByAI: { type: Boolean, default: false },
      aiAnalyzedAt: { type: Date, default: null },
      contextObservation: { type: String, default: "" },
      isDuplicate: { type: Boolean, default: false },
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    feedback: [feedbackSchema],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,

    deadline: Date,

    architectureCanvasState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ─── Completion Metrics (cached, recalculated on-demand) ─────────────────
    completionMetrics: {
      featuresTotal: { type: Number, default: 0 },
      featuresCompleted: { type: Number, default: 0 },
      tasksTotal: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
      deadlinesTotal: { type: Number, default: 0 },
      deadlinesOnTime: { type: Number, default: 0 },
      deadlinesOverdue: { type: Number, default: 0 },
      filesUploaded: { type: Number, default: 0 },
      meetingsHeld: { type: Number, default: 0 },
      lastCalculatedAt: { type: Date, default: null },
    },

    // ───  Rubric Evidence Registry ──────────────────────────────────
    evidenceRegistry: [
      {
        criterionKey: { type: String, required: true },
        type: {
          type: String,
          enum: ["link", "file", "metric"],
          required: true,
        },
        value: { type: String, required: true }, // URL, File ID, or Stringified Metric
        providedAt: { type: Date, default: Date.now },
        validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        validationStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        validationNote: String,
        originalName: String,
        fileType: String,
      },
    ],

    healthReport: {
      status: {
        type: String,
        enum: ["healthy", "at-risk", "needs-attention", "unknown"],
        default: "unknown",
      },
      score: { type: Number, default: 0 },
      summary: { type: String, default: "" },
      predictedCompletionDate: { type: Date, default: null },
      riskAlerts: [{ type: String }],
      generatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

projectSchema.index({ group: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
