import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["project_attachment", "group_resource", "user_avatar"],
      required: true,
      index: true,
    },
    relatedEntity: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    relatedModel: {
      type: String,
      enum: ["Project", "Group", "User"],
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    metadata: {
      originalName: String,
      fileType: String,
      description: String,
      linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    },
    rubricCriteria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RubricCriteria",
    },
  },
  { timestamps: true },
);

fileSchema.virtual("originalName").get(function getOriginalName() {
  return this.metadata?.originalName;
});

fileSchema.virtual("description").get(function getDescription() {
  return this.metadata?.description;
});

fileSchema.virtual("linkedTasks").get(function getLinkedTasks() {
  return this.metadata?.linkedTasks || [];
});

fileSchema.set("toJSON", { virtuals: true });
fileSchema.set("toObject", { virtuals: true });

fileSchema.index({ category: 1, relatedEntity: 1, createdAt: -1 });
fileSchema.index({ category: 1, relatedEntity: 1, "metadata.originalName": 1 });

const File = mongoose.model("File", fileSchema);

export default File;
