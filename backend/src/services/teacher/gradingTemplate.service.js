import GradingTemplate from "../../models/gradingTemplate.model.js";
import ApiError from "../../utils/apiError.js";

const createTemplate = async (data, userId) => {
  const template = await GradingTemplate.create({
    ...data,
    createdBy: userId,
  });
  return template;
};

const getTemplates = async (query = {}) => {
  return await GradingTemplate.find({ ...query, isActive: true })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
};

const getTemplateById = async (id) => {
  const template = await GradingTemplate.findById(id).lean();
  if (!template) throw new ApiError(404, "Template not found");
  return template;
};

const updateTemplate = async (id, data) => {
  const template = await GradingTemplate.findByIdAndUpdate(id, data, { new: true });
  if (!template) throw new ApiError(404, "Template not found");
  return template;
};

const deleteTemplate = async (id) => {
  const template = await GradingTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!template) throw new ApiError(404, "Template not found");
  return template;
};

const setDefaultTemplate = async (id) => {
  const template = await GradingTemplate.findById(id);
  if (!template) throw new ApiError(404, "Template not found");
  
  template.isDefault = true;
  await template.save();
  return template;
};

const GradingTemplateService = {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};

export default GradingTemplateService;
