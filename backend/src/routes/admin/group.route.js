import express from "express";
import * as groupController from "../../controllers/admin/group.controller.js";

const router = express.Router();

router.get("/", groupController.getGroupsBasedOnFilters);
router.get("/supervisor-requests/list", groupController.listSupervisorRequests);
router.patch(
  "/supervisor-requests/:requestId/review",
  groupController.reviewSupervisorRequest,
);
router.get("/:groupId", groupController.getGroupById);
router.patch("/:groupId/approve", groupController.approveGroupCreation);
router.patch("/:groupId/reject", groupController.rejectGroupCreation);
router.put("/:groupId", groupController.updateGroup);
router.delete("/:groupId", groupController.deletGroupById);
router.post("/:groupId/supervisor", groupController.assignSupervisor);

export default router;
