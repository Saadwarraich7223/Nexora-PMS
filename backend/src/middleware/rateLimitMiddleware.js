import rateLimit from "express-rate-limit";

// Apply a fixed window rate limit for all requests.

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export default rateLimitMiddleware;
