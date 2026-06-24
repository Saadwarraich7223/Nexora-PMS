import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import * as meetingService from "../../services/student/meeting.service.js";

const getMeetingLogs = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  const { logs, pagination } = await meetingService.getGroupMeetingLogs(
    req.user.activeGroup,
    {
      page: req.query.page,
      limit: req.query.limit,
    },
  );

  res.json({
    message: "Meeting logs fetched successfully",
    count: logs.length,
    logs,
    pagination,
  });
});

const createMeetingLog = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  const meeting = await meetingService.createTeamMeetingLog(
    req.user.activeGroup,
    req.user._id,
    req.body || {},
  );

  res.status(201).json({
    message: "Meeting log created successfully",
    meeting,
  });
});

const markMeetingAttendance = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  const meeting = await meetingService.updateMeetingAttendance(
    req.user.activeGroup,
    req.user._id,
    req.params.meetingId,
    req.body?.attendees,
  );

  res.json({
    message: "Meeting attendance updated successfully",
    meeting,
  });
});

const updateMeeting = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  const meeting = await meetingService.updateMeetingLog(
    req.user.activeGroup,
    req.user._id,
    req.params.meetingId,
    req.body
  );

  res.json({
    message: "Meeting updated successfully",
    meeting,
  });
});

const deleteMeeting = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  await meetingService.deleteMeetingLog(
    req.user.activeGroup,
    req.user._id,
    req.params.meetingId
  );

  res.json({
    message: "Meeting deleted successfully",
  });
});

const getPendingAttendance = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  const logs = await meetingService.getPendingAttendanceLogs(req.user.activeGroup);
  res.json({
    message: "Pending attendance meetings fetched",
    logs,
  });
});

export { getMeetingLogs, createMeetingLog, markMeetingAttendance, updateMeeting, deleteMeeting, getPendingAttendance };
