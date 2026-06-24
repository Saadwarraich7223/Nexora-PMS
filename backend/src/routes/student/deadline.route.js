import express from "express";
import * as deadlineController from "../../controllers/student/deadline.controller.js";

const router = express.Router();

router.get("/", deadlineController.getDeadlines);

export default router;
