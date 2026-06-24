// Environment configuration loader and strongly-typed access helpers.
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env if present.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Read a required env var or fall back to a provided default.
const getEnv = (key, fallback) => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
};

// Centralized application configuration object.
const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri:
    process.env.NODE_ENV === "test"
      ? getEnv("MONGO_URI_TESTS", getEnv("MONGO_URI"))
      : getEnv("MONGO_URI"),
  jwtAccessSecret: getEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  cookieSecure: (process.env.COOKIE_SECURE || "false") === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  adminName: process.env.ADMIN_NAME || "Admin",
  adminEmail: process.env.ADMIN_EMAIL || "admin@admin.com",
  adminPassword: process.env.ADMIN_PASSWORD,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || "",
  mailFrom: process.env.MAIL_FROM || "FYPMS <no-reply@example.com>",
  universityName: process.env.UNIVERSITY_NAME || "University",

  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM || "FYPMS <no-reply@example.com>",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5242880", 10),
  supervisorDefaultCapacity: parseInt(
    process.env.SUPERVISOR_DEFAULT_CAPACITY || "6",
    10,
  ),
  contributionWeights: {
    task: parseFloat(process.env.CONTRIBUTION_TASK_WEIGHT || "0.35"),
    feature: parseFloat(process.env.CONTRIBUTION_FEATURE_WEIGHT || "0.25"),
    report: parseFloat(process.env.CONTRIBUTION_REPORT_WEIGHT || "0.2"),
    peer: parseFloat(process.env.CONTRIBUTION_PEER_WEIGHT || "0.2"),
  },
};

export default config;
