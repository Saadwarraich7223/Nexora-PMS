/**
 * Migration Script: Merge Announcements into Notifications
 *
 * Purpose: Convert legacy Announcement documents into grouped Notification
 * broadcasts and remove runtime dependence on the Announcement model.
 *
 * BEFORE RUNNING:
 * 1. Backup your database: mongodump --out=backup-before-announcement-migration
 * 2. Test on a copy of production data first
 *
 * HOW TO RUN:
 * node backend/migrations/migrate-announcements-to-broadcast-notifications.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Notification from "../src/models/notification.model.js";
import User from "../src/models/user.model.js";

const announcementSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
    priority: String,
    link: String,
    targetRoles: [String],
    department: String,
    semester: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const Announcement =
  mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fypms";

const buildAudienceFilter = ({ targetRoles, department, semester }) => {
  const filter = {};
  if (Array.isArray(targetRoles) && targetRoles.length > 0) {
    filter.role = { $in: targetRoles };
  }
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  return filter;
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const announcements = await Announcement.find({}).lean();
  console.log(`Found ${announcements.length} announcements to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const announcement of announcements) {
    const alreadyMigrated = await Notification.exists({
      broadcast: true,
      broadcastId: announcement._id,
    });

    if (alreadyMigrated) {
      skipped += 1;
      continue;
    }

    const notificationsCollection = mongoose.connection.collection("notifications");
    const existingNotifications = await notificationsCollection
      .find({ announcement: announcement._id })
      .toArray();

    if (existingNotifications.length > 0) {
      await notificationsCollection.updateMany(
        { announcement: announcement._id },
        {
          $set: {
            title: announcement.title,
            message: announcement.message,
            type: "announcement",
            priority: announcement.priority || "low",
            link: announcement.link || null,
            broadcast: true,
            broadcastId: announcement._id,
            broadcastCreatedBy: announcement.createdBy,
            targetRoles: announcement.targetRoles || [],
            department: announcement.department || null,
            semester: announcement.semester || null,
          },
          $unset: { announcement: "" },
        },
      );
      migrated += 1;
      continue;
    }

    const sourceUsers = await User.find(
      buildAudienceFilter({
        targetRoles: announcement.targetRoles,
        department: announcement.department,
        semester: announcement.semester,
      }),
    )
      .select("_id")
      .lean();

    if (sourceUsers.length === 0) {
      skipped += 1;
      continue;
    }

    const docs = sourceUsers.map((user) => ({
      user: user._id,
      title: announcement.title,
      message: announcement.message,
      type: "announcement",
      priority: announcement.priority || "low",
      link: announcement.link || null,
      isRead: false,
      broadcast: true,
      broadcastId: announcement._id,
      broadcastCreatedBy: announcement.createdBy,
      targetRoles: announcement.targetRoles || [],
      department: announcement.department || null,
      semester: announcement.semester || null,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    }));

    await Notification.insertMany(docs);
    migrated += 1;
  }

  console.log(`Migrated ${migrated} announcements`);
  console.log(`Skipped ${skipped} announcements`);
  console.log("Verify broadcasts in the UI before dropping the announcements collection.");

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Migration failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
