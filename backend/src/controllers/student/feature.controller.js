import * as featureService from "../../services/student/feature.service.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";

const createFeature = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const feature = await featureService.createFeature(
    groupId,
    req.user._id,
    req.body,
    req.user.role,
  );
  res.status(201).json({ message: "Feature created successfully", feature });
});

const getFeatures = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const features = await featureService.getGroupFeatures(groupId);
  res.json({ message: "Features fetched successfully", features });
});

const updateFeature = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const feature = await featureService.updateFeature(
    req.params.featureId,
    groupId,
    req.user._id,
    req.body,
    req.user.role,
  );
  res.json({ message: "Feature updated successfully", feature });
});

const attachTask = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const feature = await featureService.attachTaskToFeature(
    req.params.featureId,
    req.params.taskId,
    groupId,
    req.user._id,
    req.user.role,
  );
  res.json({ message: "Task attached to feature successfully", feature });
});

const detachTask = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const feature = await featureService.detachTaskFromFeature(
    req.params.featureId,
    req.params.taskId,
    groupId,
    req.user._id,
    req.user.role,
  );
  res.json({ message: "Task detached from feature successfully", feature });
});

const deleteFeature = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const result = await featureService.deleteFeature(
    req.params.featureId,
    req.user._id,
    groupId,
    req.user.role,
  );
  res.json({ message: "Feature deleted successfully", result });
});

export {
  createFeature,
  getFeatures,
  updateFeature,
  attachTask,
  detachTask,
  deleteFeature,
};
