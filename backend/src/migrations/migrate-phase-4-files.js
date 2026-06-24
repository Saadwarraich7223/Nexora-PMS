import mongoose from "mongoose";
import dotenv from "dotenv";
import File from "../models/file.model.js";
import Project from "../models/project.model.js";
import { logger } from '../utils/logger.js';


dotenv.config();

// Define legacy schema internally for migration
const groupFileSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fileUrl: String,
  originalName: String,
  description: String,
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  createdAt: { type: Date, default: Date.now },
});

const GroupFile = mongoose.models.GroupFile || mongoose.model("GroupFile", groupFileSchema);

const migrateFiles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB for migration...");

    // 1. Migrate GroupFile documents
    const groupFiles = await GroupFile.find({});
    logger.info(`Found ${groupFiles.length} GroupFile documents to migrate...`);

    for (const gf of groupFiles) {
      await File.create({
        category: "group_resource",
        relatedEntity: gf.group,
        relatedModel: "Group",
        uploadedBy: gf.uploadedBy,
        fileUrl: gf.fileUrl,
        metadata: {
          originalName: gf.originalName,
          description: gf.description,
          linkedTasks: gf.linkedTasks,
        },
        createdAt: gf.createdAt,
      });
    }
    logger.info("GroupFile migration completed.");

    // 2. Migrate Project files (assuming they are still in the old format in DB)
    const projects = await Project.find({});
    logger.info(`Processing ${projects.length} projects for file migration...`);

    for (const project of projects) {
      let updated = false;

      // Migrate project.files
      if (project.files && project.files.length > 0 && typeof project.files[0] !== "string" && !mongoose.Types.ObjectId.isValid(project.files[0])) {
        const oldFiles = project.files;
        const newFileIds = [];
        for (const f of oldFiles) {
          const fileDoc = await File.create({
            category: "project_attachment",
            relatedEntity: project._id,
            relatedModel: "Project",
            uploadedBy: project.group.leader || project.group, // Fallback if leader not populated
            fileUrl: f.fileUrl,
            metadata: {
              originalName: f.originalName,
              fileType: f.fileType,
              category: f.category,
            },
            createdAt: f.uploadedAt || project.createdAt,
          });
          newFileIds.push(fileDoc._id);
        }
        project.files = newFileIds;
        updated = true;
      }

      // Migrate project.feedback.attachments
      if (project.feedback && project.feedback.length > 0) {
        for (const fb of project.feedback) {
          if (fb.attachments && fb.attachments.length > 0 && typeof fb.attachments[0] !== "string" && !mongoose.Types.ObjectId.isValid(fb.attachments[0])) {
            const oldAttachments = fb.attachments;
            const newAttachmentIds = [];
            for (const a of oldAttachments) {
              const fileDoc = await File.create({
                category: "project_attachment",
                relatedEntity: project._id,
                relatedModel: "Project",
                uploadedBy: fb.supervisorId,
                fileUrl: a.fileUrl,
                metadata: {
                  originalName: a.originalName,
                  fileType: a.fileType,
                },
                createdAt: a.uploadedAt || fb.createdAt || project.createdAt,
              });
              newAttachmentIds.push(fileDoc._id);
            }
            fb.attachments = newAttachmentIds;
            updated = true;
          }
        }
      }

      if (updated) {
        await project.save();
      }
    }

    logger.info("Project files/attachments migration completed.");
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateFiles();
