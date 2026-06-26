import express from "express";
import * as aiController from "../../controllers/student/ai.controller.js";

const router = express.Router();

router.post("/tasks/breakdown", aiController.generateTaskBreakdown);
router.post("/meetings/summarize", aiController.summarizeMeeting);
router.get("/tasks/prioritize", aiController.getPrioritizedTasks);
router.get("/team-balance", aiController.getTeamBalance);
router.get("/health-forecast", aiController.getProjectHealthForecast);

export default router;
