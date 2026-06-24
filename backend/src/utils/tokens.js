import jwt from "jsonwebtoken";
import config from "../config/env.js";

// Sign a short-lived access token.
const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiresIn,
  });

// Sign a long-lived refresh token.
const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  });

// Verify access token signature and expiration.
const verifyAccessToken = (token) => jwt.verify(token, config.jwtAccessSecret);

// Verify refresh token signature and expiration.
const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwtRefreshSecret);

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
