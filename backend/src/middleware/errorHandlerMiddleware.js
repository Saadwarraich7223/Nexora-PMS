import ApiError from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

const errorHandlerMiddleware = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const meta = err.meta || undefined;
  const isProd = process.env.NODE_ENV === "production";

  // Log the error
  logger.error(err.stack || err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      meta: err.errors,
      ...(!isProd && { stack: err.stack }),
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate key error",
      meta: err.keyValue,
      ...(!isProd && { stack: err.stack }),
    });
  }
  
  if (err instanceof ApiError) {
    return res.status(statusCode).json({
      message,
      meta,
      ...(!isProd && { stack: err.stack }),
    });
  }

  return res.status(statusCode).json({
    message,
    meta,
    ...(!isProd && { stack: err.stack }),
  });
};

export default errorHandlerMiddleware;
