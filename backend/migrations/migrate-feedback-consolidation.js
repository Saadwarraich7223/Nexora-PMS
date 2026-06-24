/**
 * Migration Script: Consolidate Dual Feedback Systems
 *
 * Purpose: Move all ProjectFeedback documents into Project.feedback array
 * Date: 2026-06-02
 *
 * BEFORE RUNNING:
 * 1. Backup your database: mongodump --out=backup-before-feedback-migration
 * 2. Test on a copy of production data first
 *
 * HOW TO RUN:
 * node backend/migrations/migrate-feedback-consolidation.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import models
import Project from "../src/models/project.model.js";

const projectFeedbackSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: String,
    title: String,
    message: String,
    priority: String,
    attachments: Array,
    relatedFeatures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feature" }],
  },
  { timestamps: true },
);

const ProjectFeedback =
  mongoose.models.ProjectFeedback ||
  mongoose.model("ProjectFeedback", projectFeedbackSchema);

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/fypms";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function migrateFeedback() {
  console.log("\n🚀 Starting feedback migration...\n");

  try {
    // Step 1: Get all ProjectFeedback documents
    const allFeedback = await ProjectFeedback.find({})
      .populate("createdBy", "name email")
      .lean();

    console.log(`📊 Found ${allFeedback.length} ProjectFeedback documents to migrate\n`);

    if (allFeedback.length === 0) {
      console.log("✅ No ProjectFeedback documents found. Migration complete.");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Step 2: Group feedback by project
    const feedbackByProject = {};
    for (const feedback of allFeedback) {
      const projectId = feedback.project.toString();
      if (!feedbackByProject[projectId]) {
        feedbackByProject[projectId] = [];
      }
      feedbackByProject[projectId].push(feedback);
    }

    console.log(`📦 Grouped feedback into ${Object.keys(feedbackByProject).length} projects\n`);

    // Step 3: Migrate each project's feedback
    for (const [projectId, feedbackItems] of Object.entries(feedbackByProject)) {
      try {
        const project = await Project.findById(projectId);

        if (!project) {
          console.log(`⚠️  Project ${projectId} not found, skipping ${feedbackItems.length} feedback items`);
          errorCount += feedbackItems.length;
          errors.push({
            projectId,
            error: "Project not found",
            feedbackCount: feedbackItems.length,
          });
          continue;
        }

        // Transform ProjectFeedback documents to Project.feedback schema
        const transformedFeedback = feedbackItems.map((fb) => ({
          supervisorId: fb.createdBy._id || fb.createdBy,
          type: fb.type || "suggestion",
          title: fb.title || "",
          message: fb.message || "",
          priority: fb.priority || "medium",
          attachments: fb.attachments || [],
          relatedFeatures: fb.relatedFeatures || [],
          source: "supervisor_feedback", // Mark as migrated from ProjectFeedback
          createdAt: fb.createdAt,
          updatedAt: fb.updatedAt,
        }));

        // Add to existing feedback array (don't overwrite existing review_decision feedback)
        project.feedback.push(...transformedFeedback);

        await project.save();

        successCount += feedbackItems.length;
        console.log(
          `✅ Migrated ${feedbackItems.length} feedback items to project: ${project.title} (${projectId})`
        );
      } catch (error) {
        errorCount += feedbackItems.length;
        errors.push({
          projectId,
          error: error.message,
          feedbackCount: feedbackItems.length,
        });
        console.error(`❌ Error migrating project ${projectId}:`, error.message);
      }
    }

    // Step 4: Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 MIGRATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} feedback items`);
    console.log(`❌ Failed to migrate: ${errorCount} feedback items`);
    console.log(`📊 Total processed: ${allFeedback.length} feedback items`);

    if (errors.length > 0) {
      console.log("\n⚠️  ERRORS:");
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. Project ${err.projectId}: ${err.error} (${err.feedbackCount} items)`);
      });
    }

    // Step 5: Verification
    console.log("\n🔍 Verification:");
    const projectsWithFeedback = await Project.countDocuments({
      "feedback.source": "supervisor_feedback",
    });
    console.log(`   Projects with migrated feedback: ${projectsWithFeedback}`);

    console.log("\n⚠️  IMPORTANT: DO NOT DELETE ProjectFeedback collection yet!");
    console.log("   1. Verify all feedback appears correctly in the UI");
    console.log("   2. Test creating new feedback");
    console.log("   3. Compare old vs new data");
    console.log("   4. Only after verification, run: db.projectfeedbacks.drop()");

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await migrateFeedback();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

main();
