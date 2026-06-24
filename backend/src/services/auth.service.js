import bcrypt from "bcryptjs";
import config from "../config/env.js";
import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import PreApprovedStudent from "../models/PreApprovedStudent.model.js";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Register a student only if the registration number is pre-approved.
const registerStudent = async ({
  registrationNumber,
  name,
  email,
  password,
}) => {
  if (!registrationNumber) {
    throw new ApiError(400, "Registration number is required");
  }

  if (!name || name.trim().length < 3) {
    throw new ApiError(400, "Name must be at least 3 characters");
  }

  if (!email || !emailRegex.test(email)) {
    throw new ApiError(400, "Valid email is required");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const preApproved = await PreApprovedStudent.findOne({ registrationNumber });

  if (!preApproved) {
    throw new ApiError(400, "Registration number not approved");
  }

  if (preApproved.isRegistered) {
    throw new ApiError(409, "Student already registered");
  }

  const existingStudent = await User.findOne({
    $or: [{ email }, { registrationNumber }],
  });

  if (existingStudent) {
    throw new ApiError(409, "User already exists");
  }

  // Pre-save hook in user model handles hashing
  const user = await User.create({
    registrationNumber,
    name,
    email,
    password,
    role: "student",
    department: preApproved.department,
    semester: preApproved.semester,
  });

  preApproved.isRegistered = true;
  await preApproved.save();

  return user;
};

// Validate credentials and issue access/refresh tokens.
const login = async ({ email, password, role }) => {
  if (!email || !emailRegex.test(email)) {
    throw new ApiError(400, "Valid email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // 1. Find user by email and include password
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // 2. Validate role if provided
  if (role && user.role !== role) {
    throw new ApiError(401, "Invalid role for this account");
  }

  // 3. Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid password");
  }

  // 4. Issue tokens with DB-provided User ID
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  // Clean up user object for response (remove password)
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, accessToken, refreshToken };
};

// Verify refresh token and rotate tokens.
const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Always find user in DB using the ID from payload
  const user = await User.findById(payload.id).select("-password");
  if (!user) {
    throw new ApiError(401, "Session expired or user not found");
  }

  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const newRefreshToken = signRefreshToken({ id: user._id, role: user.role });

  return { user, accessToken, refreshToken: newRefreshToken };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword) {
    throw new ApiError(400, "Current password is required");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, "Current password invalid");
  }

  user.password = newPassword;
  await user.save();
};

export { registerStudent, login, refresh, changePassword };
