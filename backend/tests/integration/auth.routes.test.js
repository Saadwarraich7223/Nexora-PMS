import request from "supertest";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";
import { createPreApprovedStudent } from "../helpers/factories.js";

let app;

beforeAll(async () => {
  await connectTestDB();
  app = await getTestApp();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Auth routes", () => {
  test("register success for pre-approved student", async () => {
    await createPreApprovedStudent({ registrationNumber: "REG-AUTH-1001" });

    const res = await request(app).post("/api/auth/register").send({
      registrationNumber: "REG-AUTH-1001",
      name: "Auth Success",
      email: "auth.success@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("auth.success@example.com");
  });

  test("register fails when student is not pre-approved", async () => {
    const res = await request(app).post("/api/auth/register").send({
      registrationNumber: "REG-NOT-APPROVED",
      name: "Auth Fail",
      email: "auth.fail@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(400);
    expect(String(res.body.message || "").toLowerCase()).toContain("not approved");
  });

  test("login fails with wrong password", async () => {
    await createPreApprovedStudent({ registrationNumber: "REG-AUTH-1002" });
    await request(app).post("/api/auth/register").send({
      registrationNumber: "REG-AUTH-1002",
      name: "Auth Login",
      email: "auth.login@example.com",
      password: "secret123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "auth.login@example.com",
      password: "bad-password",
      role: "student",
    });

    expect(res.status).toBe(401);
    expect(String(res.body.message || "").toLowerCase()).toContain("invalid password");
  });

  test("refresh fails when refresh token is missing (edge case)", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});

    expect(res.status).toBe(401);
    expect(String(res.body.message || "").toLowerCase()).toContain("refresh token");
  });
});

