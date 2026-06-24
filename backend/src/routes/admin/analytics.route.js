import {
  getAnalytics,
  getAtRiskGroups,
  warnGroup,
  getAnalyticsNarrative,
  getStrategicCapacityAnalysis,
  runSystemAudit,
  getSignals,
  resolveSignal,
} from "../../controllers/admin/analytics.controller.js";
import express from "express";
const router = express.Router();

router.get("/at-risk", getAtRiskGroups);
router.get("/narrative", getAnalyticsNarrative);
router.get("/strategic-capacity", getStrategicCapacityAnalysis);
router.get("/", getAnalytics);
router.post("/at-risk/:groupId/warn", warnGroup);
router.post("/run-audit", runSystemAudit);
router.get("/signals", getSignals);
router.patch("/signals/:signalId/resolve", resolveSignal);

export default router;
