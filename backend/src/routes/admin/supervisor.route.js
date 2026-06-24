import express from "express";
import * as supervisorController from "../../controllers/admin/supervisor.controller.js";

const router = express.Router();

router.get("/recommendations", supervisorController.getRecommendedSupervisors);
router.get("/", supervisorController.getSupervisors);
router.post("/assign", supervisorController.assignSupervisor);
router.get("/:id/workload", supervisorController.getWorkload);

export default router;
