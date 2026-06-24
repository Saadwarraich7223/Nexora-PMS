import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/tokens.js";

import "../helpers/setupEnv.js";

describe("Token Utils", () => {
  test("signs and verifies access token", () => {
    const token = signAccessToken({ id: "user1", role: "student" });
    const payload = verifyAccessToken(token);
    expect(payload.id).toBe("user1");
    expect(payload.role).toBe("student");
  });

  test("signs and verifies refresh token", () => {
    const token = signRefreshToken({ id: "user2", role: "teacher" });
    const payload = verifyRefreshToken(token);
    expect(payload.id).toBe("user2");
    expect(payload.role).toBe("teacher");
  });
});
