import mongoose from "mongoose";

// Project group model with leader, members, and approval status.
// Defines group identity, membership, and lifecycle state.

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      unique: true,
      maxlength: [50, "Group name cannot exceed 50 characters"],
    },
    description: { type: String, trim: true },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Group leader is  required"],
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true },
    maxMembers: {
      type: Number,
      default: 4,
      min: [2, "Group must have at least 2 members"],
    },
    status: {
      type: String,
      enum: ["draft", "pending", "active", "rejected"],
      default: "draft",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    github: {
      repoUrl: { type: String, trim: true, default: null },
      lastSync: { type: Date, default: null },
      commits: [
        {
          authorEmail: String,
          authorName: String,
          count: { type: Number, default: 0 },
        }
      ],
      recentCommits: [
        {
          sha: String,
          message: String,
          authorName: String,
          authorEmail: String,
          date: Date,
        }
      ],
      weeklyActivity: [
        {
          week: String, // e.g. "2026-W16"
          count: { type: Number, default: 0 },
        },
      ],
      dailyActivity: [
        {
          date: String, // "YYYY-MM-DD"
          count: { type: Number, default: 0 },
        },
      ],
      totalCommits: { type: Number, default: 0 },
      pullRequests: [
        {
          githubId: Number,
          number: Number,
          title: String,
          state: String,
          author: String,
          createdAt: Date,
          mergedAt: Date,
          url: String
        }
      ],
      issues: [
        {
          githubId: Number,
          number: Number,
          title: String,
          state: String,
          author: String,
          createdAt: Date,
          closedAt: Date,
          url: String
        }
      ],
      stats: {
        mergedPRs: { type: Number, default: 0 },
        closedIssues: { type: Number, default: 0 },
        openPRs: { type: Number, default: 0 },
        openIssues: { type: Number, default: 0 },
      }
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

groupSchema.index({ supervisor: 1, status: 1 });
groupSchema.index({ status: 1, department: 1, semester: 1 });
groupSchema.index({ department: 1, semester: 1 });

const Group = mongoose.model("Group", groupSchema);
export default Group;
