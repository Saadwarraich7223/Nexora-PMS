import express from "express";
import {
  getEvaluationStats,
  getAllEvaluations,
  getEvaluationsByDepartment,
  getEvaluationsBySupervisor,
  getGradeChallenges,
  resolveGradeChallenge,
} from "../../controllers/admin/evaluation.controller.js";

const router = express.Router();

router.get("/stats", getEvaluationStats);
router.get("/", getAllEvaluations);
router.get("/by-department", getEvaluationsByDepartment);
router.get("/by-supervisor", getEvaluationsBySupervisor);
router.get("/challenges", getGradeChallenges);
router.patch("/challenges/:challengeId", resolveGradeChallenge);

export default router;
