import asyncHandler from "../../utils/asyncHandler.js";
import * as aiService from "../../services/ai.service.js";
import Group from "../../models/group.model.js";
import Task from "../../models/task.model.js";
import Deadline from "../../models/deadline.model.js";
import ApiError from "../../utils/apiError.js";
import { logger } from '../../utils/logger.js';
import intelligenceService from "../../services/intelligence.service.js";


const generateTaskBreakdown = asyncHandler(async (req, res) => {
  const { featureDescription, taskCount } = req.body;
  const tasks = await aiService.generateTaskBreakdown(
    featureDescription,
    parseInt(taskCount) || 5,
  );

  res.json({
    message: "Tasks generated successfully",
    tasks,
  });
});

const summarizeMeeting = asyncHandler(async (req, res) => {
  const { discussionPoints, agenda, date } = req.body;

  const isFuture = date ? new Date(date).getTime() > Date.now() : false;

  const result = await aiService.summarizeMeeting({
    discussionPoints,
    agenda,
    isFuture,
  });
  logger.info(result);
  res.json({
    message: "Meeting summarized successfully",
    summary: result.executiveSummary,
    suggestedTasks: result.actionItems,
  });
});

const getPrioritizedTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Resolve student's group
  const group = await Group.findOne({ "members.user": userId });
  if (!group) {
    throw new ApiError(404, "Group not found for this student");
  }

  // 2. Resolve project (if any)
  const projectId = group.project;

  // 3. Fetch all active tasks for the group (todo and in-progress)
  const allTasks = await Task.find({
    group: group._id,
    status: { $in: ["todo", "in-progress"] },
  }).lean();

  // Split into current student's tasks and teammate tasks
  const myTasks = allTasks.filter(
    (t) => String(t.assignedTo?._id || t.assignedTo) === String(userId),
  );
  const teamTasks = allTasks.filter(
    (t) => String(t.assignedTo?._id || t.assignedTo) !== String(userId),
  );

  // 4. Fetch all deadlines for the project
  let deadlines = [];
  if (projectId) {
    deadlines = await Deadline.find({ project: projectId }).lean();
  }

  // 5. Call AI Service
  const prioritization = await aiService.prioritizeTasksAI({
    myTasks: myTasks.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dependencies: t.dependencies,
    })),
    teamTasks: teamTasks.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dependencies: t.dependencies,
    })),
    deadlines: deadlines.map((d) => ({
      name: d.name,
      dueDate: d.dueDate,
      featureId: d.linkedFeature,
    })),
  });

  // 7. Backend-level deduplication (Safety net)
  const uniqueRecs = [];
  const seenIds = new Set();

  if (prioritization.recommendations) {
    prioritization.recommendations.forEach((rec) => {
      if (!seenIds.has(rec.taskId)) {
        seenIds.add(rec.taskId);
        uniqueRecs.push(rec);
      }
    });
  }

  res.json({
    message: "Tasks prioritized successfully",
    recommendations: uniqueRecs,
    summary: prioritization.summary,
  });
});

const getTeamBalance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Resolve student's group
  const group = await Group.findOne({ "members.user": userId }).populate(
    "members.user",
    "name role",
  );
  if (!group) {
    throw new ApiError(404, "Group not found for this student");
  }

  // 2. Security Check: Only group leader can access full team balance
  const currentUserId = String(userId);
  const leaderId = String(group.leader?._id || group.leader);
  if (currentUserId !== leaderId) {
    throw new ApiError(
      403,
      "Only the group leader can access team load balancing",
    );
  }

  // 3. Resolve project (if any)
  const projectId = group.project;

  // 4. Fetch all active tasks for the group
  const tasks = await Task.find({
    group: group._id,
    status: { $in: ["todo", "in-progress", "review"] },
  }).lean();

  // 5. Short-circuit if no active tasks
  if (tasks.length === 0) {
    return res.json({
      message: "Team balance analyzed successfully",
      healthScore: 100,
      diagnostic:
        "All tasks are completed! The team is currently idle and ready for new milestones.",
      bottlenecks: [],
      suggestions: [],
      summary:
        "Great job! Your team has cleared the current board. Consider planning the next sprint or reviewing existing work for quality.",
    });
  }

  // 6. Fetch all deadlines for the project
  let deadlines = [];
  if (projectId) {
    deadlines = await Deadline.find({ project: projectId }).lean();
  }

  // 6. Post-process tasks: GROUP BY MEMBER for AI accuracy
  const teamWorkload = {};
  group.members.forEach((m) => {
    const name = m.user?.name || "Student";
    teamWorkload[name] = [];
  });

  // Pre-calculate blockers
  const blockerIds = new Set();
  tasks.forEach((t) => {
    (t.dependencies || []).forEach((depId) => blockerIds.add(String(depId)));
  });

  tasks.forEach((t) => {
    const assignedId = String(t.assignedTo?._id || t.assignedTo || "");
    const member = group.members.find(
      (m) => String(m.user?._id || m.user) === assignedId,
    );
    const memberName = member?.user?.name || "Unassigned";

    if (!teamWorkload[memberName]) teamWorkload[memberName] = [];

    teamWorkload[memberName].push({
      title: t.title,
      status: t.status,
      priority: t.priority,
      isABlocker: blockerIds.has(String(t._id)),
    });
  });

  // 7. Call AI Service
  const balanceData = await aiService.analyzeTeamBalanceAI({
    teamWorkload,
    deadlines: deadlines.map((d) => ({
      name: d.name,
      dueDate: d.dueDate,
    })),
    currentDate: new Date().toISOString().split("T")[0],
  });

  res.json({
    message: "Team balance analyzed successfully",
    ...balanceData,
  });
});

const getProjectHealthForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const group = await Group.findOne({ "members.user": userId });
  if (!group) throw new ApiError(404, "Group not found for this student");

  const forecast = await intelligenceService.getProjectHealthForecast(group._id);
  
  res.json({
    message: "Project health forecast generated successfully",
    ...forecast
  });
});

export {
  generateTaskBreakdown,
  summarizeMeeting,
  getPrioritizedTasks,
  getTeamBalance,
  getProjectHealthForecast
};
