import { jest } from "@jest/globals";
import notFoundMiddleware from "../../../src/middleware/notFoundMiddleware.js";

describe("notFoundMiddleware", () => {
  test("returns 404 route not found response", () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);

    notFoundMiddleware({}, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Route not found" });
  });
});
