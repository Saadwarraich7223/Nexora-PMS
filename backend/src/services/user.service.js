import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: "activeGroup",
      populate: { path: "project supervisor" },
    })
    .populate("assignedGroups")
    .select("-password");

  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateUserProfile = async (userId, payload) => {
  const allowedFields = [
    "name",
    "registrationNumber",
    "department",
    "semester",
  ];
  const updates = {};

  Object.keys(payload).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = payload[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) throw new ApiError(404, "User not found");
  return user;
};
