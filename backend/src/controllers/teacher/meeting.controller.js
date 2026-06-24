import asyncHandler from "../../utils/asyncHandler.js";
import * as meetingService from "../../services/teacher/meeting.service.js";

const createMeetingLog = asyncHandler(async (req, res) => {
  const log = await meetingService.createMeetingLog(
    req.params.groupId,
    req.user._id,
    req.body
  );
  res.status(201).json({ message: "Meeting log created successfully", log });
});

const getMeetingLogs = asyncHandler(async (req, res) => {
  const logs = await meetingService.getMeetingLogs(
    req.params.groupId,
    req.user._id
  );
  res.json({ message: "Meeting logs fetched successfully", logs });
});

const deleteMeetingLog = asyncHandler(async (req, res) => {
  const result = await meetingService.deleteMeetingLog(
    req.params.logId,
    req.user._id
  );
  res.json({ message: "Meeting log deleted successfully", result });
});

const markAttendance = asyncHandler(async (req, res) => {
  const log = await meetingService.markAttendance(
    req.params.logId,
    req.user._id,
    req.body.attendeeIds || []
  );
  res.json({ message: "Attendance marked successfully", log });
});

const getPendingAttendanceLogs = asyncHandler(async (req, res) => {
  const logs = await meetingService.getPendingAttendanceLogs(req.user._id);
  res.json({ message: "Pending attendance logs fetched successfully", logs });
});

const finalizeMeeting = asyncHandler(async (req, res) => {
  const log = await meetingService.finalizeMeetingWithAI(
    req.params.logId,
    req.user._id,
    req.body
  );
  res.json({ message: "Meeting finalized with AI summary", log });
});

const patchMeetingLog = asyncHandler(async (req, res) => {
  const log = await meetingService.finalizeMeetingWithAI(
    req.params.logId,
    req.user._id,
    req.body
  );
  res.json({ message: "Meeting log updated successfully", log });
});

export { createMeetingLog, getMeetingLogs, deleteMeetingLog, markAttendance, getPendingAttendanceLogs, finalizeMeeting, patchMeetingLog };
