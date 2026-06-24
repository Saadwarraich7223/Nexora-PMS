import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as resourceService from "../../services/student/resource.service.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import User from "../../models/user.model.js";
import File from "../../models/file.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseLinkedTaskIds = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(String).map((id) => id.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((id) => id.trim()).filter(Boolean);
      }
    } catch {
      // fallback to CSV parsing
    }

    return trimmed.split(",").map((id) => id.trim()).filter(Boolean);
  }

  return [];
};

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const user = await User.findById(req.user._id);
  if (!user.activeGroup) {
    throw new ApiError(400, "You must be in an active group to upload files");
  }

  const uploadPathParts = req.file.path.split(/[/\\]uploads[/\\]/);
  const formattedUrl =
    uploadPathParts.length > 1
      ? `/uploads/${uploadPathParts[1].replace(/\\/g, "/")}`
      : req.file.path.replace(/\\/g, "/");

  let finalOriginalName = req.body.resourceName || req.file.originalname;
  if (req.body.resourceName) {
    const ext = req.file.originalname.split(".").pop();
    if (!finalOriginalName.endsWith(`.${ext}`)) {
      finalOriginalName = `${finalOriginalName}.${ext}`;
    }
  }

  const linkedTaskIds = parseLinkedTaskIds(req.body.linkedTaskIds);

  const resource = await resourceService.uploadResource({
    groupId: user.activeGroup,
    userId: req.user._id,
    fileUrl: formattedUrl,
    description: req.body.description || "Uploaded resource",
    originalName: finalOriginalName,
    linkedTaskIds,
  });

  res.status(201).json({ message: "File uploaded successfully", resource });
});

const getFiles = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.activeGroup) {
    throw new ApiError(400, "You are not currently in a group");
  }

  const files = await resourceService.getGroupResources(
    user.activeGroup,
    req.user._id,
  );

  res.json({ message: "Files fetched successfully", files });
});

const deleteFile = asyncHandler(async (req, res) => {
  const result = await resourceService.deleteResource(
    req.params.fileId,
    req.user._id,
  );

  res.json({ message: "File deleted successfully", result });
});

const downloadFile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.activeGroup) {
    throw new ApiError(400, "You must be in an active group to download files");
  }

  const resource = await File.findById(req.params.fileId);
  if (!resource || resource.category !== "group_resource") {
    throw new ApiError(404, "Resource not found");
  }

  if (String(resource.relatedEntity) !== String(user.activeGroup)) {
    throw new ApiError(403, "You do not have permission to access this file");
  }

  let filePath;
  if (/^\/?uploads[/\\]/i.test(resource.fileUrl)) {
    const relativePart = resource.fileUrl.replace(/^\/?uploads[/\\]/i, "");
    filePath = path.join(__dirname, "../../uploads", relativePart);
  } else if (path.isAbsolute(resource.fileUrl)) {
    filePath = resource.fileUrl;
  } else {
    filePath = path.join(__dirname, "../../uploads", resource.fileUrl);
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(
      404,
      `Physical file not found on server. Path resolved to: ${filePath} | Original URL was: ${resource.fileUrl}`,
    );
  }

  if (req.query.action === "preview") {
    return res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: "Error previewing file" });
      }
    });
  }

  const downloadName = resource.originalName || "download";

  res.download(filePath, downloadName, (err) => {
    if (err) {
      if (!res.headersSent) {
        res.status(500).json({ message: "Error downloading file" });
      }
    }
  });
});

export { uploadFile, getFiles, deleteFile, downloadFile };

