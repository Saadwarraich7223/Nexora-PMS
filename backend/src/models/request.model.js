import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["group_invite", "group_join", "supervisor_request"],
      required: true,
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    relatedModel: {
      type: String,
      enum: ["Group"],
      default: "Group",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "approved", "cancelled"],
      default: "pending",
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
      default: "",
    },
    metadata: {
      supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
      reviewNote: {
        type: String,
        trim: true,
        maxlength: [500, "Review note cannot exceed 500 characters"],
        default: "",
      },
    },
  },
  { timestamps: true },
);

requestSchema.virtual("group").get(function () {
  return this.relatedEntity;
});

requestSchema.virtual("sender").get(function () {
  return this.from;
});

requestSchema.virtual("receiver").get(function () {
  return this.to;
});

requestSchema.virtual("requestedBy").get(function () {
  return this.from;
});

requestSchema.virtual("supervisorId").get(function () {
  return this.metadata?.supervisorId;
});

requestSchema.virtual("reviewedBy").get(function () {
  return this.metadata?.reviewedBy;
});

requestSchema.virtual("reviewedAt").get(function () {
  return this.metadata?.reviewedAt;
});

requestSchema.virtual("reviewNote").get(function () {
  return this.metadata?.reviewNote;
});

requestSchema.set("toJSON", { virtuals: true });
requestSchema.set("toObject", { virtuals: true });

requestSchema.index({ type: 1, relatedEntity: 1, status: 1 });
requestSchema.index({ type: 1, to: 1, status: 1 });
requestSchema.index({ type: 1, from: 1, relatedEntity: 1, status: 1 });
requestSchema.index(
  { type: 1, relatedEntity: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "supervisor_request",
      status: "pending",
    },
  },
);

const Request = mongoose.model("Request", requestSchema);

export default Request;
