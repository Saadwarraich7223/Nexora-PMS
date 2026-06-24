import express from "express";
import * as broadcastController from "../../controllers/admin/broadcast.controller.js";

const router = express.Router();

router.post("/", broadcastController.createBroadcast);
router.get("/", broadcastController.listBroadcasts);
router.delete("/:id", broadcastController.deleteBroadcast);

export default router;
