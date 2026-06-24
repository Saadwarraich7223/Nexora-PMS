import User from "../../models/user.model.js";
import Group from "../../models/group.model.js";
import Project from "../../models/project.model.js";
import Task from "../../models/task.model.js";
import Deadline from "../../models/deadline.model.js";
import MeetingLog from "../../models/meetingLog.model.js";
import Signal from "../../models/signal.model.js";

/**
 * Fetch and aggregate system-wide statistics for the admin dashboard.
 */
export const getDashboardStats = async () => {
  const [userStats, groupStats, projectStats, taskStats] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Group.aggregate([
      { $match: { status: { $ne: "draft" } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);

  // Helper to flatten the aggregation results into an object { [status]: count }
  const formatStats = (statsArray) =>
    statsArray.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

  const users = formatStats(userStats);
  const groups = formatStats(groupStats);
  const projects = formatStats(projectStats);
  const tasks = formatStats(taskStats);

  // Add total counts for convenience
  users.total = Object.values(users).reduce((a, b) => a + b, 0);
  groups.total = Object.values(groups).reduce((a, b) => a + b, 0);
  projects.total = Object.values(projects).reduce((a, b) => a + b, 0);
  tasks.total = Object.values(tasks).reduce((a, b) => a + b, 0);

  // Add signal metrics
  const activeSignals = await Signal.countDocuments({ status: "open" });

  return {
    users,
    groups,
    projects,
    tasks,
    activeSignals
  };
};

/**
 * Identify and evaluate active groups for risk factors.
 * Rules:
 * - High Risk: Overdue project deadline, or multiple overdue tasks
 * - Medium Risk: No supervisor, no project submitted, project rejected, no tasks created, no meetings in 30 days
 */
export const getAtRiskGroups = async () => {
  const activeGroups = await Group.find({ status: "active" })
    .populate("supervisor", "name email")
    .populate("project", "status title deadline")
    .lean();

  const orphanGroups = [];
  const unresponsiveSupervisors = [];
  const failingGroups = [];

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Group active groups by supervisor for the unresponsive check
  const supervisorActivity = new Map();

  for (const group of activeGroups) {
    // 1. Orphan Groups
    if (!group.supervisor) {
      orphanGroups.push({
        groupId: group._id,
        groupName: group.name,
        department: group.department,
        semester: group.semester,
        severity: "high",
        issues: ["No supervisor assigned"],
      });
      continue; // Skip further checks for orphans
    }

    // Prepare supervisor activity tracking
    const supervisorId = String(group.supervisor._id);
    if (!supervisorActivity.has(supervisorId)) {
      supervisorActivity.set(supervisorId, {
        supervisor: group.supervisor,
        groups: [],
        totalMeetings: 0,
      });
    }

    const issues = [];
    let severity = "low";

    // 2. Critically Failing Groups (Admin Escalation)
    // Only flag if it's a severe problem that the supervisor is failing to resolve
    if (group.project?.status === "rejected") {
      issues.push("Project proposal rejected");
      severity = "high";
    }

    // Check project deadlines
    if (group.project) {
      const deadlines = await Deadline.find({ project: group.project._id }).lean();
      const overdueDeadlines = deadlines.filter((d) => d.dueDate && new Date(d.dueDate) < now);
      if (overdueDeadlines.length > 0) {
        issues.push(`${overdueDeadlines.length} overdue project deadline(s)`);
        severity = "high";
      }
    }

    // Check task activity (multiple overdue tasks)
    const tasks = await Task.find({ group: group._id }).lean();
    const overdueTasks = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== "completed"
    );
    if (overdueTasks.length >= 3) {
      issues.push(`${overdueTasks.length} overdue task(s)`);
      severity = "high";
    }

    // Check meetings
    const recentMeetingsCount = await MeetingLog.countDocuments({
      group: group._id,
      date: { $gte: thirtyDaysAgo },
    });

    const supData = supervisorActivity.get(supervisorId);
    supData.groups.push(group.name);
    supData.totalMeetings += recentMeetingsCount;

    if (issues.length > 0 && severity === "high") {
      failingGroups.push({
        groupId: group._id,
        groupName: group.name,
        supervisor: group.supervisor,
        department: group.department,
        semester: group.semester,
        severity,
        issues,
      });
    }
  }

  // 3. Evaluate Unresponsive Supervisors
  for (const [supervisorId, data] of supervisorActivity.entries()) {
    if (data.totalMeetings === 0 && data.groups.length > 0) {
      unresponsiveSupervisors.push({
        supervisorId,
        supervisorName: data.supervisor.name,
        supervisorEmail: data.supervisor.email,
        affectedGroups: data.groups,
        issues: ["No meetings logged with any assigned group in the last 30 days"],
        severity: "medium",
      });
    }
  }

  // Return the new categorized risk report for the Admin Escalation Center
  return {
    orphanGroups,
    unresponsiveSupervisors,
    failingGroups: failingGroups.sort((a, b) => b.issues.length - a.issues.length),
  };
};

/**
 * Gather data for strategic capacity analysis.
 * Fetches all faculty with their workloads and all unassigned (pending) groups.
 */
export const getStrategicCapacityData = async () => {
  const supervisors = await User.find({ role: "teacher" })
    .select("name department supervisorCapacity assignedGroups")
    .lean();

  const pendingGroups = await Group.find({ 
    $or: [{ supervisor: { $exists: false } }, { supervisor: null }],
    status: { $ne: "draft" } 
  }).countDocuments();

  const faculty = supervisors.map(s => ({
    name: s.name,
    dept: s.department,
    capacity: s.supervisorCapacity || 0,
    load: Array.isArray(s.assignedGroups) ? s.assignedGroups.length : 0
  }));

  return { faculty, pendingGroups: Array.from({ length: pendingGroups }) };
};
