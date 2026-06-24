import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);

export default router;
