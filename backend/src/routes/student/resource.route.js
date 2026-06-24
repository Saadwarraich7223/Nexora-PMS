import express from "express";
import * as resourceController from "../../controllers/student/resource.controller.js";
import { upload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", resourceController.getFiles);
router.post("/upload", upload.single("file"), resourceController.uploadFile);
router.get("/:fileId/download", resourceController.downloadFile);
router.delete("/:fileId", resourceController.deleteFile);

export default router;
