import mongoose from "mongoose";

const meetingLogSchema = new mongoose.Schema(
  {
    // The group this meeting belongs to
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    // Who created/recorded this meeting
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Meeting meta
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["Team Meeting", "Supervisor Meeting", "Demo", "Other"],
      default: "Team Meeting",
    },
    location: { type: String, trim: true },

    // Structured meeting content
    agenda: { type: String, trim: true }, // what was planned
    discussionPoints: [{ type: String, trim: true }], // key discussion points

    // Tasks discussed or updated in this meeting
    taskUpdates: [
      {
        task: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
          required: true,
        },
        note: { type: String, trim: true }, // discussion note
        status: {
          type: String,
          enum: ["todo", "in-progress", "review", "completed"],
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        deadline: Date,
      },
    ],

    // Features discussed or assigned in this meeting
    featureUpdates: [
      {
        feature: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Feature",
          required: true,
        },
        note: { type: String, trim: true }, // discussion note about feature
        status: {
          type: String,
          enum: ["planned", "in-progress", "completed"],
        },
        progress: { type: Number, min: 0, max: 100 },
      },
    ],

    // Track who attended the meeting
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // AI generated insights
    aiSummary: {
      executiveSummary: String,
      keyDecisions: [String],
      actionItems: [
        {
          item: String,
          assignee: String,
          deadline: String,
        },
      ],
      nextMeetingFocus: String,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  },
);

meetingLogSchema.index({ group: 1, createdAt: -1 });
meetingLogSchema.index({ group: 1, date: -1 });
meetingLogSchema.index({ createdBy: 1, createdAt: -1 });

const MeetingLog = mongoose.model("MeetingLog", meetingLogSchema);
export default MeetingLog;
