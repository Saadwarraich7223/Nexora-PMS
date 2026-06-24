import express from "express";
import * as groupController from "../../controllers/teacher/group.controller.js";

const router = express.Router();

router.get("/assigned", groupController.getMyAssignedGroups);
router.get("/at-risk", groupController.getMyAtRiskGroups);
router.post("/:groupId/warn", groupController.warnGroup);
router.get("/assigned/:groupId/workspace", groupController.getGroupWorkspace);
router.get("/assigned/:groupId", groupController.getGroupDetails);

export default router;
