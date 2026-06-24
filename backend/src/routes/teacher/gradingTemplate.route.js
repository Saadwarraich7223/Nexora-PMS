import express from "express";
import GradingTemplateController from "../../controllers/teacher/gradingTemplate.controller.js";

const router = express.Router();

router.get("/", GradingTemplateController.getTemplates);
router.post("/", GradingTemplateController.createTemplate);
router.get("/:id", GradingTemplateController.getTemplateById);
router.put("/:id", GradingTemplateController.updateTemplate);
router.delete("/:id", GradingTemplateController.deleteTemplate);
router.patch("/:id/default", GradingTemplateController.setDefaultTemplate);

export default router;
