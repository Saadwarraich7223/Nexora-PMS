// Express application setup with global middleware and API route mounting.

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { morganMiddleware } from "./utils/logger.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import config from "./config/env.js";
import errorHandlerMiddleware from "./middleware/errorHandlerMiddleware.js";
import rateLimitMiddleware from "./middleware/rateLimitMiddleware.js";
import notFoundMiddleware from "./middleware/notFoundMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import studentRoutes from "./routes/student.route.js";
import teacherRoutes from "./routes/teacher.route.js";
import notificationRoutes from "./routes/notification.route.js";
import userRoutes from "./routes/user.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import chatRoutes from "./routes/chat.route.js";
import rubricRoutes from "./routes/admin/rubric.route.js";

// Create the Express app instance used by the HTTP server.
const app = express();
// Security headers for common hardening.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", config.clientOrigin, "https://api.github.com"],
    },
  },
  frameguard: { action: 'deny' },
}));
// Prevent NoSQL string injection
app.use(mongoSanitize());
// HTTP request logging via Winston
app.use(morganMiddleware);
// Parse JSON request bodies.
app.use(express.json());
// Parse URL-encoded request bodies.
app.use(express.urlencoded({ extended: false }));
// Parse cookies for auth tokens and session data.
app.use(cookieParser());
// CORS configuration to allow the frontend origin to access APIs.
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
// Apply a global rate limit to reduce abuse.
app.use(rateLimitMiddleware);
// Expose uploaded files via a static route.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route registration for each API module.
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/rubrics", rubricRoutes);

// 404 handler for unknown routes.
app.use(notFoundMiddleware);
// Centralized error handling.
app.use(errorHandlerMiddleware);

export default app;
