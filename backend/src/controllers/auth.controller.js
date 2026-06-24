import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";
import config from "../config/env.js";

const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
};

const registerStudent = asyncHandler(async (req, res, next) => {
  const user = await authService.registerStudent(req.body);

  res.status(201).json({
    status: "success",
    message: "Student's account activated successfully",
    user,
  });
});

const login = asyncHandler(async (req, res, next) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  const safeUser = typeof user.toObject === "function" ? user.toObject() : user;

  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({
      status: "success",
      message: "Login successful",
      user: { ...safeUser, password: undefined },
    });
});

// Issue new access and refresh tokens from a valid refresh cookie.

const refreshTheTokens = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  const {
    user,
    refreshToken: newRefresh,
    accessToken,
  } = await authService.refresh(refreshToken);
  res
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", newRefresh, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ user });
});

// Clear auth cookies to end the session.
const logout = asyncHandler(async (req, res, next) => {
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({ message: "Logged out" });
});

const changePassword = asyncHandler(async (req, res, next) => {
  await authService.changePassword(req.user._id, req.body);
  res.json({ message: "Password updated" });
});

export { registerStudent, login, refreshTheTokens, logout, changePassword };
