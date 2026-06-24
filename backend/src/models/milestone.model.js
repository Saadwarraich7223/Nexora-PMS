import mongoose from "mongoose";

/**
 * Milestone model tracks major checkpoints in a project.
 * Each milestone is linked to specific RubricCriteria that must be satisfied.
 */
const milestoneSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "completed", "blocked"],
      default: "pending",
    },
    // Array of keys from RubricCriteria that this milestone targets
    criteriaKeys: [
      {
        type: String,
        required: true,
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    order: {
      type: Number,
      default: 0,
      description: "Display order of milestones",
    },
  },
  { timestamps: true },
);

// One milestone name per project (e.g. "Mid-term" can only exist once per project)
milestoneSchema.index({ project: 1, name: 1 }, { unique: true });

const Milestone = mongoose.model("Milestone", milestoneSchema);

export default Milestone;
