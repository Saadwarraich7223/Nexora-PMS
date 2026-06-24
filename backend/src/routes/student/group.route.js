import express from "express";
import * as groupController from "../../controllers/student/group.controller.js";

const router = express.Router();

router.post("/", groupController.createGroup);
router.post("/invite", groupController.inviteOtherStudentToGroup);
router.post("/invites/:inviteId", groupController.respondToInviteFromAGroup);
router.post("/join", groupController.requestToJoinGroup);
router.post("/join/:requestId", groupController.respondToJoinRequest);
router.post("/submit", groupController.submitGroupForApproval);
router.post("/update", groupController.updateGroupByLeader);

router.post("/leave", groupController.leaveGroup);
router.delete("/members/:userId", groupController.removeMember);
router.patch("/transfer-leadership", groupController.transferLeadership);
router.get("/supervisors/available", groupController.getAvailableSupervisors);
router.post("/supervisor-request", groupController.createSupervisorRequest);
router.get("/supervisor-request", groupController.getMySupervisorRequest);
router.delete(
  "/supervisor-request/:requestId",
  groupController.cancelMySupervisorRequest,
);

router.delete("/delete", groupController.deletGroupByLeader);
router.post("/github/link", groupController.linkGithubRepo);
router.post("/github/sync", groupController.syncGithubCommits);
router.delete("/github/unlink", groupController.unlinkGithubRepo);

router.get("/", groupController.getUserRelatedGroups);
router.get("/students", groupController.getUserRelatedStudents);
router.get("/invites", groupController.getInvites);
router.get("/join-requests", groupController.getJoinRequests);
router.get("/my-group", groupController.getMyGroup);
router.get("/:groupId", groupController.getAGroup);

export default router;
