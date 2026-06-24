import express from "express";
import * as featureController from "../../controllers/student/feature.controller.js";

const router = express.Router();

router.post("/", featureController.createFeature);
router.get("/", featureController.getFeatures);
router.put("/:featureId", featureController.updateFeature);
router.post("/:featureId/tasks/:taskId", featureController.attachTask);
router.delete("/:featureId/tasks/:taskId", featureController.detachTask);
router.delete("/:featureId", featureController.deleteFeature);

export default router;
