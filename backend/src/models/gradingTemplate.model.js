import mongoose from "mongoose";

const gradingTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Weights for Group Evaluation
    weights: {
      deadlinePerformance: { type: Number, default: 0.3 },
      featureCompletion: { type: Number, default: 0.25 },
      taskCompletion: { type: Number, default: 0.15 },
      meetingEngagement: { type: Number, default: 0.1 },
      codeContribution: { type: Number, default: 0.1 },
      proposalQuality: { type: Number, default: 0.1 },
    },
    // Weights for Individual Member Contribution
    memberWeights: {
      featuresImplemented: { type: Number, default: 0.4 },
      tasksCompleted: { type: Number, default: 0.3 },
      meetingAttendance: { type: Number, default: 0.2 },
      githubCommits: { type: Number, default: 0.1 },
    },
    // Thresholds and Expectations
    expectations: {
      meetingsPerMonth: { type: Number, default: 4 },
      minCommitsPerWeek: { type: Number, default: 3 },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Ensure only one default template exists
gradingTemplateSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
  next();
});

const GradingTemplate = mongoose.model("GradingTemplate", gradingTemplateSchema);
export default GradingTemplate;
