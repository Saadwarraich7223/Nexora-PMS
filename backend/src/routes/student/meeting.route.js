import express from "express";
import * as meetingController from "../../controllers/student/meeting.controller.js";

const router = express.Router();

router.get("/pending-attendance", meetingController.getPendingAttendance);
router.get("/", meetingController.getMeetingLogs);
router.post("/", meetingController.createMeetingLog);
router.patch("/:meetingId/attendance", meetingController.markMeetingAttendance);
router.put("/:meetingId", meetingController.updateMeeting);
router.delete("/:meetingId", meetingController.deleteMeeting);

export default router;
