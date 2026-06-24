import ApiError from "../../utils/apiError.js";
import Project from "../../models/project.model.js";
import Group from "../../models/group.model.js";
import MeetingLog from "../../models/meetingLog.model.js";
import { analyzeProjectHealthAI } from "../ai.service.js";
import { calculateCompletionMetrics } from "./evaluation.service.js";

/**
 * Generate a project health report by aggregating metrics and leveraging AI.
 */
export const generateProjectHealthReport = async (projectId, teacherId) => {
  // 1. Recalculate metrics in real-time to ensure data integrity
  await calculateCompletionMetrics(projectId, teacherId);

  const project = await Project.findById(projectId).populate("group");
  
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group) throw new ApiError(404, "Project does not have an associated group");

  // Get latest meeting date
  const latestMeeting = await MeetingLog.findOne({ group: project.group._id })
    .sort({ date: -1 })
    .select("date");

  // Prepare metrics payload
  const metrics = {
    tasksCompleted: project.completionMetrics?.tasksCompleted || 0,
    tasksTotal: project.completionMetrics?.tasksTotal || 0,
    featuresCompleted: project.completionMetrics?.featuresCompleted || 0,
    featuresTotal: project.completionMetrics?.featuresTotal || 0,
    deadlinesMet: project.completionMetrics?.deadlinesOnTime || 0,
    deadlinesTotal: project.completionMetrics?.deadlinesTotal || 0,
    meetingsHeld: project.completionMetrics?.meetingsHeld || 0,
    daysSinceLastMeeting: latestMeeting ? Math.floor((new Date() - new Date(latestMeeting.date)) / (1000 * 60 * 60 * 24)) : "Unknown",
    totalGithubCommits: project.group.github?.totalCommits || 0,
  };

  // Call Groq AI service
  const aiHealthReport = await analyzeProjectHealthAI(metrics);

  // Update project
  project.healthReport = aiHealthReport;
  await project.save();

  return aiHealthReport;
};
