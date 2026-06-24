import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import asyncHandler from "../../utils/asyncHandler.js";
import * as resourceService from "../../services/teacher/resource.service.js";
import ApiError from "../../utils/apiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getGroupFiles = asyncHandler(async (req, res) => {
  const files = await resourceService.getGroupFilesAsSupervisor(
    req.params.groupId,
    req.user._id,
  );
  res.json({ message: "Group files fetched successfully", files });
});

const downloadFile = asyncHandler(async (req, res) => {
  const file = await resourceService.getResourceFileAsSupervisor(
    req.params.fileId,
    req.user._id,
  );

  let filePath;
  if (/^\/?uploads[/\\]/i.test(file.fileUrl)) {
    const relativePart = file.fileUrl.replace(/^\/?uploads[/\\]/i, "");
    filePath = path.join(__dirname, "../../uploads", relativePart);
  } else if (path.isAbsolute(file.fileUrl)) {
    filePath = file.fileUrl;
  } else {
    filePath = path.join(__dirname, "../../uploads", file.fileUrl);
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Physical file not found on server");
  }

  if (req.query.action === "preview") {
    return res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: "Error previewing file" });
      }
    });
  }

  const downloadName = file.originalName || "download";
  res.download(filePath, downloadName, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ message: "Error downloading file" });
    }
  });
});

export { getGroupFiles, downloadFile };
