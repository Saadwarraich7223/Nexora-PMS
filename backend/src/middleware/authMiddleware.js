import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/tokens.js";

// Authenticate requests using JWT from cookies or Authorization header.
// Attach authenticated user to req.user or fail with 401.

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired access token");
    }

    // Optimized lookup: Only select essential fields and use lean() for performance
    const user = await User.findById(payload.id)
      .select("_id role department semester activeGroup email name")
      .lean();

    if (!user) {
      throw new ApiError(401, "User session invalid or user deleted");
    }

    req.user = {
      _id: user._id,
      role: user.role,
      department: user.department,
      semester: user.semester,
      activeGroup: user.activeGroup,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export { authMiddleware as verifyJWT };
export default authMiddleware;
