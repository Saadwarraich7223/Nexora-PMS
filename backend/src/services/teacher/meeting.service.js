import MeetingLog from "../../models/meetingLog.model.js";
import Group from "../../models/group.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";
import * as aiService from "../../services/ai.service.js";

const verifySupervisor = async (groupId, supervisorId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (String(group.supervisor) !== String(supervisorId)) {
    throw new ApiError(403, "You are not the supervisor of this group");
  }
  return group;
};

const createMeetingLog = async (groupId, supervisorId, payload) => {
  const group = await verifySupervisor(groupId, supervisorId);
  const meetingLog = await MeetingLog.create({
    ...payload,
    group: groupId,
    createdBy: supervisorId,
  });

  // Notify group members about the new meeting
  await notificationService.createNotificationsBulk(
    (group.members || []).map((member) => ({
      user: member.user,
      message: `Supervisor scheduled a new meeting log for your group: "${meetingLog.type || "Meeting"}"`,
      type: "meeting",
      priority: "medium",
    })),
  );

  // If meeting is in the past, remind teacher to mark attendance immediately
  const meetingDate = new Date(meetingLog.date || meetingLog.createdAt);
  if (meetingDate.getTime() < Date.now()) {
    await notificationService.createNotification({
      user: supervisorId,
      message: `Reminder: Mark attendance for the "${meetingLog.type || "Meeting"}" with ${group.name} that has already ended.`,
      type: "meeting",
      priority: "high",
    });
    // Also notify the group leader
    if (group.leader && String(group.leader) !== String(supervisorId)) {
      await notificationService.createNotification({
        user: group.leader,
        message: `A past meeting "${meetingLog.type || "Meeting"}" was logged by your supervisor. Please coordinate attendance marking.`,
        type: "meeting",
        priority: "medium",
      });
    }
  }

  // Trigger AI Summary in the background
  finalizeMeetingWithAI(meetingLog._id, supervisorId).catch(err => console.error("Auto-AI Summary failed:", err));

  return meetingLog;
};

const getMeetingLogs = async (groupId, supervisorId) => {
  await verifySupervisor(groupId, supervisorId);
  const logs = await MeetingLog.find({ group: groupId }).populate(
    "attendees",
    "name email",
  );
  return logs;
};

const deleteMeetingLog = async (logId, supervisorId) => {
  const log = await MeetingLog.findById(logId);
  if (!log) throw new ApiError(404, "Meeting log not found");
  await verifySupervisor(log.group, supervisorId);

  if (String(log.createdBy) !== String(supervisorId)) {
    throw new ApiError(403, "You can only delete logs you created");
  }

  await log.deleteOne();
  return { deleted: true };
};

const markAttendance = async (logId, supervisorId, attendeeIds) => {
  const log = await MeetingLog.findById(logId);
  if (!log) throw new ApiError(404, "Meeting log not found");

  const group = await verifySupervisor(log.group, supervisorId);

  // Validate every attendee is a member of the group
  const memberIds = (group.members || []).map((m) => String(m.user));
  for (const id of attendeeIds) {
    if (!memberIds.includes(String(id))) {
      throw new ApiError(400, `User ${id} is not a member of this group`);
    }
  }

  log.attendees = attendeeIds;
  await log.save();

  // Notify marked attendees
  if (attendeeIds.length > 0) {
    await notificationService.createNotificationsBulk(
      attendeeIds.map((userId) => ({
        user: userId,
        message: `Your attendance has been recorded for the "${log.type || "Meeting"}" on ${new Date(log.date).toLocaleDateString()}.`,
        type: "meeting",
        priority: "low",
      })),
    );
  }

  const updated = await MeetingLog.findById(logId).populate(
    "attendees",
    "name email",
  );
  return updated;
};

const getPendingAttendanceLogs = async (supervisorId) => {
  // Find all groups supervised by this teacher
  const groups = await Group.find({ supervisor: supervisorId }).select("_id name");
  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g._id);

  // Find meetings that are in the past and have no attendees marked
  const logs = await MeetingLog.find({
    group: { $in: groupIds },
    date: { $lt: new Date() },
    $or: [
      { attendees: { $exists: false } },
      { attendees: { $size: 0 } },
    ],
  })
    .populate({
      path: "group",
      select: "name members",
      populate: { path: "members.user", select: "name email" },
    })
    .sort({ date: -1 });

  return logs;
};

const finalizeMeetingWithAI = async (logId, supervisorId, payload = {}) => {
  const log = await MeetingLog.findById(logId);
  if (!log) throw new ApiError(404, "Meeting log not found");

  await verifySupervisor(log.group, supervisorId);

  // Update with final edits if provided
  if (payload.agenda) log.agenda = payload.agenda;
  if (payload.discussionPoints) log.discussionPoints = payload.discussionPoints;
  await log.save();

  // Generate summary using AI service
  const summary = await aiService.generateMeetingSummaryAI({
    agenda: log.agenda,
    discussionPoints: log.discussionPoints || [],
  });

  log.aiSummary = summary;
  await log.save();

  // Notify members that AI summary is ready
  const group = await Group.findById(log.group);
  await notificationService.createNotificationsBulk(
    (group.members || []).map((m) => ({
      user: m.user,
      message: `AI Intelligence Narrator has generated a summary for your meeting layout: "${log.type}" on ${new Date(log.date).toLocaleDateString()}.`,
      type: "meeting",
      priority: "medium",
    })),
  );

  return log;
};

export {
  createMeetingLog,
  getMeetingLogs,
  deleteMeetingLog,
  markAttendance,
  getPendingAttendanceLogs,
  finalizeMeetingWithAI,
};
