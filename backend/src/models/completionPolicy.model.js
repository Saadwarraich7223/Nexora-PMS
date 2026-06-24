import mongoose from "mongoose";

const completionPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    version: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    scope: {
      department: { type: String, trim: true, default: null },
      semester: { type: Number, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    requirePublishedEvaluation: {
      type: Boolean,
      default: true,
    },
    completionCriteria: {
      minTaskCompletionPercent: { type: Number, default: 80, min: 0, max: 100 },
      allFeaturesCompleted: { type: Boolean, default: true },
      allDeadlinesResolved: { type: Boolean, default: true },
      minFilesUploaded: { type: Number, default: 1, min: 0 },
      minMeetingsHeld: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true },
);

completionPolicySchema.index(
  { "scope.department": 1, "scope.semester": 1, isActive: 1 },
  { name: "completion_policy_scope_idx" },
);

const CompletionPolicy = mongoose.model("CompletionPolicy", completionPolicySchema);

export default CompletionPolicy;
