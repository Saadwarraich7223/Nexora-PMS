import ApiError from "../utils/apiError.js";

// Role-based access guard for protected routes.
// Ensure the authenticated user has one of the allowed roles.

const roleMiddleware =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You are not authorized to perform that action"),
      );
    }

    return next();
  };

export default roleMiddleware;
