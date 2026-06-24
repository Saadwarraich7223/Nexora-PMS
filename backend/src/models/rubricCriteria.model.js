import mongoose from "mongoose";

/**
 * RubricCriteria defines what constitutes evidence for a specific grading category.
 * These act as the "contract" between students and the grading system.
 */
const rubricCriteriaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      description: "Match with GRADING_CONFIG keys (e.g. featureCompletion)",
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    evidenceType: {
      type: String,
      required: true,
      enum: ["automated", "file", "link"],
      description: "How is this evidence provided?",
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    scope: {
      department: { type: String, default: null },
      semester: { type: Number, default: null },
    },
    metadata: {
      allowedExtensions: [String],
      placeholder: String,
      linkPattern: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Search criteria by scope
rubricCriteriaSchema.index({ "scope.department": 1, "scope.semester": 1, isActive: 1 });

const RubricCriteria = mongoose.model("RubricCriteria", rubricCriteriaSchema);

export default RubricCriteria;
