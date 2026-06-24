import { jest } from "@jest/globals";

const authServiceMock = {
  registerStudent: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  changePassword: jest.fn(),
};

await jest.unstable_mockModule("../../../src/services/auth.service.js", () => authServiceMock);
const { registerStudent, login, refreshTheTokens, logout, changePassword } = await import(
  "../../../src/controllers/auth.controller.js"
);

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.cookie = jest.fn(() => res);
  res.clearCookie = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("auth.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registerStudent returns 201 with created user", async () => {
    const req = { body: { email: "s@example.com" } };
    const res = createRes();
    const next = jest.fn();
    authServiceMock.registerStudent.mockResolvedValue({ _id: "u1", email: "s@example.com" });

    await registerStudent(req, res, next);

    expect(authServiceMock.registerStudent).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        user: expect.objectContaining({ email: "s@example.com" }),
      }),
    );
  });

  test("login sets cookies and returns safe user", async () => {
    const req = { body: { email: "s@example.com", password: "secret123" } };
    const res = createRes();
    const next = jest.fn();

    authServiceMock.login.mockResolvedValue({
      user: { _id: "u1", email: "s@example.com", password: "hashed" },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    await login(req, res, next);

    expect(authServiceMock.login).toHaveBeenCalledWith(req.body);
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ email: "s@example.com", password: undefined }),
      }),
    );
  });

  test("refreshTheTokens rotates tokens from refresh cookie", async () => {
    const req = { cookies: { refreshToken: "old-refresh" } };
    const res = createRes();
    const next = jest.fn();

    authServiceMock.refresh.mockResolvedValue({
      user: { _id: "u1", email: "s@example.com" },
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });

    await refreshTheTokens(req, res, next);

    expect(authServiceMock.refresh).toHaveBeenCalledWith("old-refresh");
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith({ user: { _id: "u1", email: "s@example.com" } });
  });

  test("logout clears auth cookies", async () => {
    const req = {};
    const res = createRes();
    const next = jest.fn();

    await logout(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.json).toHaveBeenCalledWith({ message: "Logged out" });
  });

  test("changePassword delegates to service", async () => {
    const req = {
      user: { _id: "u1" },
      body: { currentPassword: "old123", newPassword: "new12345" },
    };
    const res = createRes();
    const next = jest.fn();

    authServiceMock.changePassword.mockResolvedValue(undefined);

    await changePassword(req, res, next);

    expect(authServiceMock.changePassword).toHaveBeenCalledWith("u1", req.body);
    expect(res.json).toHaveBeenCalledWith({ message: "Password updated" });
  });
});

