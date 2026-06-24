import GradingTemplateService from "../../services/teacher/gradingTemplate.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

const createTemplate = asyncHandler(async (req, res) => {
  const template = await GradingTemplateService.createTemplate(req.body, req.user._id);
  res.status(201).json({ status: "success", template });
});

const getTemplates = asyncHandler(async (req, res) => {
  const templates = await GradingTemplateService.getTemplates(req.query);
  res.json({ status: "success", templates });
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await GradingTemplateService.getTemplateById(req.params.id);
  res.json({ status: "success", template });
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await GradingTemplateService.updateTemplate(req.params.id, req.body);
  res.json({ status: "success", template });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  await GradingTemplateService.deleteTemplate(req.params.id);
  res.status(204).send();
});

const setDefaultTemplate = asyncHandler(async (req, res) => {
  const template = await GradingTemplateService.setDefaultTemplate(req.params.id);
  res.json({ status: "success", template });
});

const GradingTemplateController = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};

export default GradingTemplateController;
