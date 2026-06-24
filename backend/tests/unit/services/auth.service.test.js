import { jest } from "@jest/globals";

const userFindOneMock = jest.fn();
const userCreateMock = jest.fn();
const userFindByIdMock = jest.fn();

const preApprovedFindOneMock = jest.fn();

const signAccessTokenMock = jest.fn();
const signRefreshTokenMock = jest.fn();
const verifyRefreshTokenMock = jest.fn();

await jest.unstable_mockModule("../../../src/models/user.model.js", () => ({
  default: {
    findOne: userFindOneMock,
    create: userCreateMock,
    findById: userFindByIdMock,
  },
}));

await jest.unstable_mockModule("../../../src/models/PreApprovedStudent.model.js", () => ({
  default: {
    findOne: preApprovedFindOneMock,
  },
}));

await jest.unstable_mockModule("../../../src/utils/tokens.js", () => ({
  signAccessToken: signAccessTokenMock,
  signRefreshToken: signRefreshTokenMock,
  verifyRefreshToken: verifyRefreshTokenMock,
}));

const authService = await import("../../../src/services/auth.service.js");

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registerStudent creates user and marks pre-approved record registered", async () => {
    const preApproved = {
      registrationNumber: "REG-SVC-1",
      department: "CS",
      semester: 8,
      isRegistered: false,
      save: jest.fn().mockResolvedValue(undefined),
    };
    preApprovedFindOneMock.mockResolvedValue(preApproved);
    userFindOneMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({ _id: "u1", email: "svc1@example.com" });

    const user = await authService.registerStudent({
      registrationNumber: "REG-SVC-1",
      name: "Service User",
      email: "svc1@example.com",
      password: "secret123",
    });

    expect(userCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationNumber: "REG-SVC-1",
        role: "student",
        department: "CS",
        semester: 8,
      }),
    );
    expect(preApproved.isRegistered).toBe(true);
    expect(preApproved.save).toHaveBeenCalled();
    expect(user.email).toBe("svc1@example.com");
  });

  test("registerStudent fails when registration number not approved", async () => {
    preApprovedFindOneMock.mockResolvedValue(null);

    await expect(
      authService.registerStudent({
        registrationNumber: "REG-NA",
        name: "No Approval",
        email: "no.approval@example.com",
        password: "secret123",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("login returns tokens and safe user", async () => {
    const userDoc = {
      _id: "u2",
      role: "student",
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: () => ({ _id: "u2", role: "student", email: "svc2@example.com", password: "hash" }),
    };
    userFindOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });
    signAccessTokenMock.mockReturnValue("access-1");
    signRefreshTokenMock.mockReturnValue("refresh-1");

    const result = await authService.login({
      email: "svc2@example.com",
      password: "secret123",
      role: "student",
    });

    expect(signAccessTokenMock).toHaveBeenCalled();
    expect(signRefreshTokenMock).toHaveBeenCalled();
    expect(result.user.password).toBeUndefined();
    expect(result.accessToken).toBe("access-1");
  });

  test("login fails on role mismatch (edge case)", async () => {
    const userDoc = {
      _id: "u3",
      role: "teacher",
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: () => ({ _id: "u3", role: "teacher", email: "t@example.com" }),
    };
    userFindOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    await expect(
      authService.login({
        email: "t@example.com",
        password: "secret123",
        role: "student",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test("refresh rotates tokens for valid refresh token", async () => {
    verifyRefreshTokenMock.mockReturnValue({ id: "u4" });
    userFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: "u4", role: "student" }),
    });
    signAccessTokenMock.mockReturnValue("access-2");
    signRefreshTokenMock.mockReturnValue("refresh-2");

    const result = await authService.refresh("valid-refresh");

    expect(verifyRefreshTokenMock).toHaveBeenCalledWith("valid-refresh");
    expect(result.accessToken).toBe("access-2");
    expect(result.refreshToken).toBe("refresh-2");
  });

  test("changePassword fails when current password is wrong", async () => {
    const userDoc = {
      comparePassword: jest.fn().mockResolvedValue(false),
      save: jest.fn(),
    };
    userFindByIdMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    });

    await expect(
      authService.changePassword("u5", {
        currentPassword: "bad-old",
        newPassword: "newSecret123",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

