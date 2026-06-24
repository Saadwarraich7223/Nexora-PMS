import express from "express";
import {
  changePassword,
  login,
  logout,
  refreshTheTokens,
  registerStudent,
} from "../controllers/auth.controller.js";
import validateMiddleware from "../middleware/validateMiddleware.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../validations/auth.validations.js";
import authMiddleware from "../middleware/authMiddleware.js";

// Router scoped to /api/auth.
const router = express.Router();

router.post("/register", validateMiddleware(registerSchema), registerStudent);
router.post("/login", validateMiddleware(loginSchema), login);

router.post("/refresh", refreshTheTokens);
router.post("/logout", logout);
router.post(
  "/change-password",
  authMiddleware,
  validateMiddleware(changePasswordSchema),
  changePassword,
);

export default router;
