import { jest } from "@jest/globals";
import errorHandlerMiddleware from "../../../src/middleware/errorHandlerMiddleware.js";
import ApiError from "../../../src/utils/apiError.js";

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("errorHandlerMiddleware", () => {
  test("handles ApiError with provided status/message/meta", () => {
    const res = createRes();
    const err = new ApiError(403, "Forbidden operation", { reason: "ROLE_MISMATCH" });

    errorHandlerMiddleware(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden operation",
      meta: { reason: "ROLE_MISMATCH" },
    });
  });

  test("maps mongoose validation errors to 400", () => {
    const res = createRes();
    const err = {
      name: "ValidationError",
      errors: { email: { message: "Email is required" } },
    };

    errorHandlerMiddleware(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Validation error",
      meta: err.errors,
    });
  });

  test("maps duplicate key errors to 409", () => {
    const res = createRes();
    const err = { code: 11000, keyValue: { email: "duplicate@example.com" } };

    errorHandlerMiddleware(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Duplicate key error",
      meta: { email: "duplicate@example.com" },
    });
  });

  test("defaults unknown errors to 500", () => {
    const res = createRes();
    const err = new Error("Unexpected crash");

    errorHandlerMiddleware(err, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unexpected crash",
      meta: undefined,
    });
  });
});
