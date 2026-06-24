import * as taskService from "../../services/student/task.service.js";
import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";

const createTask = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const task = await taskService.createTask(groupId, req.user._id, req.body);
  res.status(201).json({ message: "Task created successfully", task });
});

const getTasks = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const { tasks, pagination } = await taskService.getGroupTasks(groupId, {
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json({ message: "Tasks fetched successfully", tasks, pagination });
});

const getTask = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const task = await taskService.getTaskById(req.params.taskId, groupId);
  res.json({ message: "Task fetched successfully", task });
});

const updateTask = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const task = await taskService.updateTask(
    req.params.taskId,
    groupId,
    req.user._id,
    req.body,
  );
  res.json({ message: "Task updated successfully", task });
});

const setTaskResources = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");

  const resourceIds = Array.isArray(req.body.resourceIds)
    ? req.body.resourceIds
    : [];

  const task = await taskService.setTaskResources(
    req.params.taskId,
    groupId,
    req.user._id,
    resourceIds,
  );

  res.json({ message: "Task resources updated successfully", task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You must be in an active group");
  const result = await taskService.deleteTask(
    req.params.taskId,
    req.user._id,
    groupId,
  );
  res.json({ message: "Task deleted successfully", result });
});

export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  setTaskResources,
  deleteTask,
};
