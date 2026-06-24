import express from "express";
import * as preApprovedController from "../../controllers/admin/preApprovedStudent.controller.js";
import { upload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/upload",
  upload.single("file"),
  preApprovedController.uploadPreApprovedStudents,
);
router.get("/", preApprovedController.fetchPreApprovedList);
router.put("/:id", preApprovedController.updatePreApprovedStudent);
router.delete("/:id", preApprovedController.deletePreApprovedStudent);
router.delete("/", preApprovedController.clearPreApproved);

export default router;
