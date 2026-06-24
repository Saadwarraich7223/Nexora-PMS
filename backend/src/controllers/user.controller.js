import asyncHandler from "../utils/asyncHandler.js";
import * as userService from "../services/user.service.js";

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user._id);
  res.json({ message: "User profile fetched successfully", user });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user._id, req.body);
  res.json({ message: "User profile updated successfully", user });
});

export { getMe, updateMe };
