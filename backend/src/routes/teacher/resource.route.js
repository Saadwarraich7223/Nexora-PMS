import express from "express";
import * as resourceController from "../../controllers/teacher/resource.controller.js";

const router = express.Router();

router.get("/groups/:groupId", resourceController.getGroupFiles);
router.get("/:fileId/download", resourceController.downloadFile);

export default router;
