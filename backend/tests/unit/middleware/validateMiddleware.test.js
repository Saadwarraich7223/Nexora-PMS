import { jest } from "@jest/globals";
import Joi from "joi";
import validateMiddleware from "../../../src/middleware/validateMiddleware.js";

describe("validateMiddleware", () => {
  const schema = Joi.object({
    body: Joi.object({
      name: Joi.string().required(),
      extra: Joi.string(),
    }).required(),
    params: Joi.object({}).required(),
    query: Joi.object({}).required(),
  });

  test("passes sanitized payload to next on valid input", () => {
    const req = {
      body: { name: "Valid", unknown: "remove-me" },
      params: {},
      query: {},
    };
    const next = jest.fn();

    validateMiddleware(schema)(req, {}, next);

    expect(req.body).toEqual({ name: "Valid" });
    expect(next).toHaveBeenCalledWith();
  });

  test("returns 400 api error on invalid input", () => {
    const req = { body: {}, params: {}, query: {} };
    const next = jest.fn();

    validateMiddleware(schema)(req, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: "Invalid request",
      }),
    );
  });
});

