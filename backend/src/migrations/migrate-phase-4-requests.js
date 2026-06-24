import mongoose from "mongoose";
import dotenv from "dotenv";
import Request from "../models/request.model.js";
import { logger } from '../utils/logger.js';


dotenv.config();

// Define legacy schemas internally for migration
const groupInviteRequestSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" },
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const groupJoinRequestSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" },
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const groupSupervisorRequestSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, default: "pending" },
  note: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  reviewNote: String,
  createdAt: { type: Date, default: Date.now },
});

const GroupInviteRequest = mongoose.models.GroupInviteRequest || mongoose.model("GroupInviteRequest", groupInviteRequestSchema);
const GroupJoinRequest = mongoose.models.GroupJoinRequest || mongoose.model("GroupJoinRequest", groupJoinRequestSchema);
const GroupSupervisorRequest = mongoose.models.GroupSupervisorRequest || mongoose.model("GroupSupervisorRequest", groupSupervisorRequestSchema);

const migrateRequests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB for request migration...");

    // 1. GroupInviteRequest
    const invites = await GroupInviteRequest.find({});
    logger.info(`Found ${invites.length} GroupInviteRequests...`);
    for (const inv of invites) {
      await Request.create({
        type: "group_invite",
        from: inv.sender,
        to: inv.receiver,
        relatedEntity: inv.group,
        relatedModel: "Group",
        status: inv.status,
        message: inv.message || "",
        createdAt: inv.createdAt,
      });
    }

    // 2. GroupJoinRequest
    const joins = await GroupJoinRequest.find({});
    logger.info(`Found ${joins.length} GroupJoinRequests...`);
    for (const jn of joins) {
      await Request.create({
        type: "group_join",
        from: jn.sender,
        relatedEntity: jn.group,
        relatedModel: "Group",
        status: jn.status,
        message: jn.message || "",
        createdAt: jn.createdAt,
      });
    }

    // 3. GroupSupervisorRequest
    const supervisors = await GroupSupervisorRequest.find({});
    logger.info(`Found ${supervisors.length} GroupSupervisorRequests...`);
    for (const sup of supervisors) {
      await Request.create({
        type: "supervisor_request",
        from: sup.requestedBy,
        relatedEntity: sup.group,
        relatedModel: "Group",
        status: sup.status,
        message: sup.note || "",
        metadata: {
          supervisorId: sup.supervisorId,
          reviewedBy: sup.reviewedBy,
          reviewedAt: sup.reviewedAt,
          reviewNote: sup.reviewNote,
        },
        createdAt: sup.createdAt,
      });
    }

    logger.info("Request migration completed successfully.");
    process.exit(0);
  } catch (err) {
    logger.error("Migration failed:", err);
    process.exit(1);
  }
};

migrateRequests();
