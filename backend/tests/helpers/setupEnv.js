process.env.NODE_ENV = "test";

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test_access_secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test_refresh_secret";

process.env.ADMIN_NAME = process.env.ADMIN_NAME || "Test Admin";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin_password";

process.env.COOKIE_SECURE = process.env.COOKIE_SECURE || "false";
process.env.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE || "lax";

process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads_test";
