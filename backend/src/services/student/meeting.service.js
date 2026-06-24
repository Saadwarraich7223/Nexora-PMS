import MeetingLog from "../../models/meetingLog.model.js";
import Group from "../../models/group.model.js";
import Task from "../../models/task.model.js";
import Feature from "../../models/feature.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";
import * as aiService from "../../services/ai.service.js";
import { buildPaginationMeta, normalizePagination } from "../../utils/pagination.js";

const getGroupMemberIds = (group) => {
  const ids = new Set(
    (group.members || []).map((member) => String(member.user?._id || member.user)),
  );
  if (group.leader) ids.add(String(group.leader));
  return [...ids];
};

const normalizeTaskUpdates = (updates) => {
  if (!Array.isArray(updates)) return [];
  return updates
    .filter((item) => item?.task)
    .map((item) => ({
      task: item.task,
      note: item.note ? String(item.note).trim() : undefined,
      status: item.status || undefined,
      priority: item.priority || undefined,
      deadline: item.deadline || undefined,
    }));
};

const normalizeFeatureUpdates = (updates) => {
  if (!Array.isArray(updates)) return [];
  return updates
    .filter((item) => item?.feature)
    .map((item) => ({
      feature: item.feature,
      note: item.note ? String(item.note).trim() : undefined,
      status: item.status || undefined,
      progress:
        item.progress === undefined || item.progress === null || item.progress === ""
          ? undefined
          : Number(item.progress),
    }));
};

const assertTaskAndFeatureUpdatesBelongToGroup = async (
  groupId,
  taskUpdates,
  featureUpdates,
) => {
  const taskIds = taskUpdates.map((item) => item.task);
  if (taskIds.length > 0) {
    const foundTasks = await Task.find({ _id: { $in: taskIds }, group: groupId }).select("_id");
    if (foundTasks.length !== taskIds.length) {
      throw new ApiError(400, "One or more task updates are invalid for this group");
    }
  }

  const featureIds = featureUpdates.map((item) => item.feature);
  if (featureIds.length > 0) {
    const foundFeatures = await Feature.find({
      _id: { $in: featureIds },
      group: groupId,
    }).select("_id");
    if (foundFeatures.length !== featureIds.length) {
      throw new ApiError(400, "One or more feature updates are invalid for this group");
    }
  }
};

const getGroupMeetingLogs = async (groupId, { page, limit } = {}) => {
  const filter = { group: groupId };
  const shouldPaginate = page !== undefined || limit !== undefined;

  if (!shouldPaginate) {
    const logs = await MeetingLog.find(filter)
      .populate("createdBy", "name email")
      .populate("attendees", "name email")
      .populate("taskUpdates.task", "title status priority deadline")
      .populate("featureUpdates.feature", "name description")
      .sort({ createdAt: -1 });

    return {
      logs,
      pagination: buildPaginationMeta({
        total: logs.length,
        page: 1,
        limit: logs.length || 1,
      }),
    };
  }

  const pagination = normalizePagination({ page, limit, defaultLimit: 20 });

  const [logs, total] = await Promise.all([
    MeetingLog.find(filter)
      .populate("createdBy", "name email")
      .populate("attendees", "name email")
      .populate("taskUpdates.task", "title status priority deadline")
      .populate("featureUpdates.feature", "name description")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    MeetingLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

const createTeamMeetingLog = async (groupId, userId, payload) => {
  const group = await Group.findById(groupId).populate("members.user", "name email");
  if (!group) throw new ApiError(404, "Group not found");

  if (String(group.leader) !== String(userId)) {
    throw new ApiError(403, "Only the group leader can create team meetings");
  }

  const groupMemberIds = getGroupMemberIds(group);
  const groupMemberIdSet = new Set(groupMemberIds);

  const requestedAttendeesRaw = Array.isArray(payload.attendees)
    ? payload.attendees.map((id) => String(id))
    : [];
  const requestedAttendees = payload.includeAllMembers
    ? groupMemberIds
    : requestedAttendeesRaw;

  const invalidAttendee = requestedAttendees.find(
    (attendeeId) => !groupMemberIdSet.has(attendeeId),
  );
  if (invalidAttendee) {
    throw new ApiError(400, "Attendees must be from your group");
  }

  const discussionPoints = Array.isArray(payload.discussionPoints)
    ? payload.discussionPoints
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];

  const taskUpdates = normalizeTaskUpdates(payload.taskUpdates);
  const featureUpdates = normalizeFeatureUpdates(payload.featureUpdates);
  await assertTaskAndFeatureUpdatesBelongToGroup(groupId, taskUpdates, featureUpdates);

  const meetingLog = await MeetingLog.create({
    group: groupId,
    createdBy: userId,
    date: payload.date ? new Date(payload.date) : new Date(),
    type: "Team Meeting",
    location: String(payload.location || "").trim() || undefined,
    agenda: String(payload.agenda || "").trim() || undefined,
    discussionPoints,
    attendees: requestedAttendees,
    taskUpdates,
    featureUpdates,
  });

  const notifyTargets = (group.members || [])
    .map((member) => String(member.user?._id || member.user))
    .filter((memberId) => memberId !== String(userId));

  await notificationService.createNotificationsBulk(
    notifyTargets.map((memberId) => ({
      user: memberId,
      message: "A new team meeting was added by your group leader.",
      type: "meeting",
      priority: "medium",
    })),
  );

  // If meeting is in the past, remind the student leader to mark attendance
  const meetingDate = new Date(meetingLog.date || meetingLog.createdAt);
  if (meetingDate.getTime() < Date.now()) {
    await notificationService.createNotification({
      user: userId,
      message: `Reminder: Mark attendance for the Team Meeting "${meetingLog.agenda || "Meeting"}" that has already ended.`,
      type: "meeting",
      priority: "medium",
    });
  }

  // Trigger AI Summary in the background
  finalizeMeetingWithAI(meetingLog._id).catch(err => console.error("Auto-AI Summary failed:", err));

  return await MeetingLog.findById(meetingLog._id)
    .populate("createdBy", "name email")
    .populate("attendees", "name email")
    .populate("taskUpdates.task", "title status priority deadline")
    .populate("featureUpdates.feature", "name description");
};

const finalizeMeetingWithAI = async (meetingId) => {
  try {
    const log = await MeetingLog.findById(meetingId);
    if (!log) return;

    const summary = await aiService.generateMeetingSummaryAI({
      agenda: log.agenda,
      discussionPoints: log.discussionPoints || [],
      isFuture: new Date(log.date) > new Date()
    });

    log.aiSummary = {
      executiveSummary: summary.executiveSummary,
      keyDecisions: summary.keyDecisions,
      nextMeetingFocus: summary.nextMeetingFocus,
      actionItems: (summary.actionItems || []).map(item => ({
        item: item.title || item.item,
        assignee: item.assignee,
        deadline: item.deadline
      }))
    };

    await log.save();
  } catch (err) {
    console.error("AI Meeting Summarization Error:", err);
  }
};

const updateMeetingAttendance = async (groupId, userId, meetingId, attendees) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (String(group.leader) !== String(userId)) {
    throw new ApiError(403, "Only the group leader can mark meeting attendance");
  }

  const meeting = await MeetingLog.findOne({ _id: meetingId, group: groupId });
  if (!meeting) throw new ApiError(404, "Meeting not found");

  const meetingDate = new Date(meeting.date || meeting.createdAt);
  if (meetingDate.getTime() > Date.now()) {
    throw new ApiError(400, "Attendance can be marked only after meeting time");
  }

  const requestedAttendees = Array.isArray(attendees) ? attendees.map((id) => String(id)) : [];
  const memberIdSet = new Set(getGroupMemberIds(group));
  const invalidAttendee = requestedAttendees.find((id) => !memberIdSet.has(id));
  if (invalidAttendee) {
    throw new ApiError(400, "Attendance list contains non-group member");
  }

  meeting.attendees = requestedAttendees;
  await meeting.save();

  // Notify marked attendees
  if (requestedAttendees.length > 0) {
    await notificationService.createNotificationsBulk(
      requestedAttendees.map((attendeeId) => ({
        user: attendeeId,
        message: `Your group leader marked you as present for the Team Meeting on ${new Date(meeting.date).toLocaleDateString()}.`,
        type: "meeting",
        priority: "low",
      })),
    );
  }

  return await MeetingLog.findById(meeting._id)
    .populate("createdBy", "name email")
    .populate("attendees", "name email")
    .populate("taskUpdates.task", "title status priority deadline")
    .populate("featureUpdates.feature", "name description");
};

const updateMeetingLog = async (groupId, userId, meetingId, payload) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (String(group.leader) !== String(userId)) {
    throw new ApiError(403, "Only the group leader can update team meetings");
  }

  const meeting = await MeetingLog.findOne({ _id: meetingId, group: groupId });
  if (!meeting) throw new ApiError(404, "Meeting not found");

  if (meeting.type === "Supervisor Meeting") {
    throw new ApiError(403, "Students cannot edit supervisor meetings. Please contact your supervisor.");
  }

  if (payload.location !== undefined) meeting.location = String(payload.location || "").trim() || undefined;
  if (payload.agenda !== undefined) meeting.agenda = String(payload.agenda || "").trim() || undefined;
  if (payload.discussionPoints !== undefined) {
    meeting.discussionPoints = Array.isArray(payload.discussionPoints)
      ? payload.discussionPoints.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
  }
  if (payload.date) {
    meeting.date = new Date(payload.date);
  }

  await meeting.save();

  return await MeetingLog.findById(meeting._id)
    .populate("createdBy", "name email")
    .populate("attendees", "name email")
    .populate("taskUpdates.task", "title status priority deadline")
    .populate("featureUpdates.feature", "name description");
};

const deleteMeetingLog = async (groupId, userId, meetingId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (String(group.leader) !== String(userId)) {
    throw new ApiError(403, "Only the group leader can delete team meetings");
  }

  const meeting = await MeetingLog.findOne({ _id: meetingId, group: groupId });
  if (!meeting) throw new ApiError(404, "Meeting not found");

  if (meeting.type === "Supervisor Meeting") {
    throw new ApiError(403, "Students cannot delete supervisor meetings. Please contact your supervisor.");
  }

  await MeetingLog.findByIdAndDelete(meetingId);
  return meeting;
};

const getPendingAttendanceLogs = async (groupId) => {
  const logs = await MeetingLog.find({
    group: groupId,
    date: { $lt: new Date() },
    $or: [
      { attendees: { $exists: false } },
      { attendees: { $size: 0 } },
    ],
  })
    .populate("createdBy", "name email")
    .sort({ date: -1 });

  return logs;
};

export { getGroupMeetingLogs, createTeamMeetingLog, updateMeetingAttendance, updateMeetingLog, deleteMeetingLog, getPendingAttendanceLogs, finalizeMeetingWithAI };
