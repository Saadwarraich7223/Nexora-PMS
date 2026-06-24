import express from "express";
import * as meetingController from "../../controllers/teacher/meeting.controller.js";

const router = express.Router();

router.get("/pending-attendance", meetingController.getPendingAttendanceLogs);
router.post("/groups/:groupId", meetingController.createMeetingLog);
router.get("/groups/:groupId", meetingController.getMeetingLogs);
router.patch("/:logId/attendance", meetingController.markAttendance);
router.patch("/:logId", meetingController.patchMeetingLog);
router.post("/:logId/finalize", meetingController.finalizeMeeting);
router.delete("/:logId", meetingController.deleteMeetingLog);

export default router;
