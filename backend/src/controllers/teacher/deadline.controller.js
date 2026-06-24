import asyncHandler from "../../utils/asyncHandler.js";
import * as deadlineService from "../../services/teacher/deadline.service.js";

const createDeadline = asyncHandler(async (req, res) => {
  const deadline = await deadlineService.createDeadline(
    req.params.projectId,
    req.user._id,
    req.body
  );
  res.status(201).json({ message: "Deadline created successfully", deadline });
});

const getProjectDeadlines = asyncHandler(async (req, res) => {
  const deadlines = await deadlineService.getProjectDeadlines(
    req.params.projectId,
    req.user._id
  );
  res.json({ message: "Deadlines fetched successfully", deadlines });
});

const deleteDeadline = asyncHandler(async (req, res) => {
  const result = await deadlineService.deleteDeadline(
    req.params.deadlineId,
    req.user._id
  );
  res.json({ message: "Deadline deleted successfully", result });
});

const overrideDeadlineStatus = asyncHandler(async (req, res) => {
  const { overrideStatus, overrideNote, grade, maxGrade } = req.body;
  const deadline = await deadlineService.overrideDeadlineStatus(
    req.params.deadlineId,
    req.user._id,
    { overrideStatus, overrideNote, grade, maxGrade }
  );
  res.json({ message: "Deadline status overridden", deadline });
});

export { createDeadline, getProjectDeadlines, deleteDeadline, overrideDeadlineStatus };

