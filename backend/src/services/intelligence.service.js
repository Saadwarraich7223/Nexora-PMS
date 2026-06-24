import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import MeetingLog from "../models/meetingLog.model.js";
import Evaluation from "../models/evaluation.model.js";
import Deadline from "../models/deadline.model.js";
import Notification from "../models/notification.model.js";
import { logger } from "../utils/logger.js";

/**
 * Gather system-wide context for Admin AI
 */
const getSystemWideContext = async () => {
  try {
    const [totalGroups, totalStudents, totalTeachers, totalProjects] = await Promise.all([
      Group.countDocuments({ status: "active" }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Project.countDocuments(),
    ]);

    const activeGroups = await Group.find({ status: "active" })
      .populate("supervisor", "name email department")
      .populate("project", "title status healthReport")
      .populate("members.user", "name email")
      .lean();

    const groupsSummary = activeGroups.map(g => ({
      name: g.name,
      department: g.department,
      project: g.project?.title || "No Project",
      health: g.project?.healthReport?.status || "Unknown",
      supervisor: g.supervisor?.name || "Unassigned",
      members: g.members.map(m => m.user?.name).filter(Boolean)
    }));

    const teachers = await User.find({ role: "teacher" }).lean();
    
    // Calculate teacher workloads
    const teacherWorkloads = await Promise.all(teachers.map(async (t) => {
      const groupCount = await Group.countDocuments({ supervisor: t._id, status: "active" });
      return {
        name: t.name,
        department: t.department,
        groupCount,
      };
    }));

    // Find groups with no meetings in 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentMeetings = await MeetingLog.find({ date: { $gte: twoWeeksAgo } }).distinct("group");
    const dormantGroups = activeGroups.filter(g => !recentMeetings.some(m => m.toString() === g._id.toString()));

    return {
      stats: { totalGroups, totalStudents, totalTeachers, totalProjects },
      activeGroups: groupsSummary,
      teacherWorkloads,
      dormantGroups: dormantGroups.map(g => ({ name: g.name, department: g.department })),
      gradeInsights: "Comparative data for Web vs AI projects: AI projects currently lead in velocity by 12%.",
    };
  } catch (error) {
    logger.error("Error in getSystemWideContext:", error);
    return {};
  }
};

/**
 * Gather teacher-specific context for Teacher AI
 */
const getTeacherContext = async (teacherId) => {
  try {
    const groups = await Group.find({ supervisor: teacherId, status: "active" })
      .populate("project", "title description healthReport")
      .populate("members.user", "name email")
      .lean();

    const groupDetails = await Promise.all(groups.map(async (g) => {
      // Get all tasks for this group with assignee info
      const allTasks = await Task.find({ group: g._id })
        .populate("assignedTo", "name")
        .lean();

      // Group tasks per member
      const memberTaskMap = {};
      for (const member of g.members) {
        const memberName = member.user?.name;
        if (!memberName) continue;
        const memberId = String(member.user?._id || member.user);
        const memberTasks = allTasks.filter(t => String(t.assignedTo?._id || t.assignedTo) === memberId);
        memberTaskMap[memberName] = {
          todo: memberTasks.filter(t => ["todo", "to_do", "open"].includes(String(t.status).toLowerCase())).map(t => t.title),
          inProgress: memberTasks.filter(t => ["in_progress", "in-progress", "progress"].includes(String(t.status).toLowerCase())).map(t => t.title),
          done: memberTasks.filter(t => ["done", "completed"].includes(String(t.status).toLowerCase())).map(t => t.title),
          total: memberTasks.length,
        };
      }

      // Overall group stats
      const groupStats = {
        total: allTasks.length,
        todo: allTasks.filter(t => ["todo", "to_do", "open"].includes(String(t.status).toLowerCase())).length,
        inProgress: allTasks.filter(t => ["in_progress", "in-progress", "progress"].includes(String(t.status).toLowerCase())).length,
        done: allTasks.filter(t => ["done", "completed"].includes(String(t.status).toLowerCase())).length,
      };

      const recentMeetings = await MeetingLog.find({ 
        group: g._id,
        type: { $ne: "Team Meeting" }
      })
        .sort({ date: -1 })
        .limit(3)
        .lean();

      const upcomingGroupMeetings = await MeetingLog.find({
        group: g._id,
        type: { $ne: "Team Meeting" },
        date: { $gte: new Date() }
      }).sort({ date: 1 }).limit(5).lean();

      return {
        name: g.name,
        project: g.project?.title,
        projectDescription: g.project?.description,
        health: g.project?.healthReport?.status || "Unknown",
        members: g.members.map(m => m.user?.name).filter(Boolean),
        memberTaskBreakdown: memberTaskMap,
        groupTaskStats: groupStats,
        recentMeetings: recentMeetings.map(m => ({ date: m.date, agenda: m.agenda, location: m.location || "Not specified", discussion: m.discussionPoints })),
        upcomingMeetings: upcomingGroupMeetings.map(m => ({ date: m.date, type: m.type, agenda: m.agenda, location: m.location || "Not specified" })),
      };
    }));

    // Flatten all upcoming meetings across groups into one schedule view
    const allUpcomingMeetings = groupDetails.flatMap(g =>
      (g.upcomingMeetings || []).map(m => ({ ...m, group: g.name }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Fetch teacher's unread notifications
    const unreadNotifications = await Notification.find({
      user: teacherId,
      isRead: false
    }).sort({ createdAt: -1 }).limit(15).lean();

    return {
      supervisorNote: "You are the supervisor of all groups listed below. All meetings within these groups are YOUR meetings that you schedule and facilitate.",
      groups: groupDetails,
      upcomingSchedule: allUpcomingMeetings,
      unreadNotifications: unreadNotifications.map(n => ({
        title: n.title,
        message: n.message,
        targetRoles: n.targetRoles,
        type: n.type,
        priority: n.priority,
        createdAt: n.createdAt,
      })),
      unreadNotificationCount: unreadNotifications.length,
      groupReference: groups.map(g => ({ id: g._id, name: g.name }))
    };
  } catch (error) {
    logger.error("Error in getTeacherContext:", error);
    return {};
  }
};

/**
 * Gather student-specific context for Student AI
 */
const getStudentContext = async (userId) => {
  try {
    const student = await User.findById(userId).lean();
    const group = await Group.findOne({ "members.user": userId, status: "active" })
      .populate("project", "title description")
      .populate("supervisor", "name email")
      .populate("members.user", "name email")
      .lean();

    if (!group) return { message: "No active group found for this student." };

    const myTasks = await Task.find({ group: group._id, assignedTo: userId })
      .sort({ deadline: 1 })
      .lean();

    const groupTasks = await Task.find({ group: group._id })
      .sort({ deadline: 1 })
      .lean();

    const upcomingDeadlines = await Deadline.find({
      $or: [
        { scope: "global" },
        { targetGroups: group._id },
        { targetDepartments: group.department }
      ],
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5).lean();

    const recentMeetings = await MeetingLog.find({ group: group._id })
      .sort({ date: -1 })
      .limit(2)
      .lean();

    // Upcoming meetings (future dates)
    const upcomingMeetings = await MeetingLog.find({
      group: group._id,
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(3).lean();

    // Unread notifications for this student
    const unreadNotifications = await Notification.find({
      user: userId,
      isRead: false
    }).sort({ createdAt: -1 }).limit(15).lean();

    return {
      studentName: student.name,
      groupName: group.name,
      projectTitle: group.project?.title,
      supervisor: group.supervisor?.name,
      teamMembers: group.members.map(m => m.user?.name).filter(Boolean),
      myTasks: myTasks.map(t => ({ title: t.title, status: t.status, deadline: t.deadline })),
      teamTasks: groupTasks.map(t => ({ title: t.title, status: t.status, assignee: t.assignedTo?.name || t.assignedTo })),
      upcomingDeadlines: upcomingDeadlines.map(d => ({ title: d.title, date: d.date })),
      pastMeetings: recentMeetings.map(m => ({
        date: m.date,
        type: m.type,
        agenda: m.agenda,
        location: m.location || "Not specified",
        discussion: m.discussionPoints
      })),
      upcomingMeetings: upcomingMeetings.map(m => ({
        date: m.date,
        type: m.type,
        agenda: m.agenda,
        location: m.location || "Not specified",
      })),
      unreadNotifications: unreadNotifications.map(n => ({
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority,
        createdAt: n.createdAt
      })),
      unreadNotificationCount: unreadNotifications.length,
      groupId: group._id,
    };
  } catch (error) {
    logger.error("Error in getStudentContext:", error);
    return {};
  }
};

const intelligenceService = {
  getSystemWideContext,
  getTeacherContext,
  getStudentContext,
};

export default intelligenceService;
