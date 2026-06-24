import { jest } from "@jest/globals";

const userFindByIdMock = jest.fn();
const verifyAccessTokenMock = jest.fn();

await jest.unstable_mockModule("../../../src/models/user.model.js", () => ({
  default: { findById: userFindByIdMock },
}));
await jest.unstable_mockModule("../../../src/utils/tokens.js", () => ({
  verifyAccessToken: verifyAccessTokenMock,
}));

const { default: authMiddleware } = await import("../../../src/middleware/authMiddleware.js");

describe("authMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("passes when token is valid and user exists", async () => {
    const req = { cookies: { accessToken: "token-1" }, headers: {} };
    const res = {};
    const next = jest.fn();
    verifyAccessTokenMock.mockReturnValue({ id: "u1" });
    userFindByIdMock.mockResolvedValue({
      _id: "u1",
      role: "student",
      department: "CS",
      semester: 8,
      activeGroup: null,
      email: "u1@example.com",
      name: "User One",
    });

    await authMiddleware(req, res, next);

    expect(verifyAccessTokenMock).toHaveBeenCalledWith("token-1");
    expect(userFindByIdMock).toHaveBeenCalledWith("u1");
    expect(req.user).toEqual(
      expect.objectContaining({
        _id: "u1",
        role: "student",
        email: "u1@example.com",
      }),
    );
    expect(next).toHaveBeenCalledWith();
  });

  test("fails when no token is provided", async () => {
    const req = { cookies: {}, headers: {} };
    const res = {};
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test("fails when token is invalid", async () => {
    const req = { cookies: {}, headers: { authorization: "Bearer bad-token" } };
    const res = {};
    const next = jest.fn();
    verifyAccessTokenMock.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "Invalid or expired access token",
      }),
    );
  });

  test("fails when user is deleted but token is still valid", async () => {
    const req = { cookies: { accessToken: "token-2" }, headers: {} };
    const res = {};
    const next = jest.fn();
    verifyAccessTokenMock.mockReturnValue({ id: "missing-user" });
    userFindByIdMock.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: "User does not exists",
      }),
    );
  });
});

