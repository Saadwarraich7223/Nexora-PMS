import { jest } from "@jest/globals";
import roleMiddleware from "../../../src/middleware/roleMiddleware.js";

describe("roleMiddleware", () => {
  test("allows request when user has allowed role", () => {
    const req = { user: { role: "admin" } };
    const next = jest.fn();

    roleMiddleware("admin", "teacher")(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("blocks request when user is missing", () => {
    const req = {};
    const next = jest.fn();

    roleMiddleware("admin")(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: "Authentication required" }),
    );
  });

  test("blocks request when role is unauthorized", () => {
    const req = { user: { role: "student" } };
    const next = jest.fn();

    roleMiddleware("admin")(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });
});
