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

describe("Auth API", () => {
  test("registers a pre-approved student", async () => {
    await createPreApprovedStudent({ registrationNumber: "REG-2001" });

    const res = await request(app).post("/api/auth/register").send({
      registrationNumber: "REG-2001",
      name: "Test Student",
      email: "student@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("student@example.com");
  });

  test("logs in a student", async () => {
    await createPreApprovedStudent({ registrationNumber: "REG-2002" });

    await request(app).post("/api/auth/register").send({
      registrationNumber: "REG-2002",
      name: "Login Student",
      email: "login@example.com",
      password: "secret123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "secret123",
      role: "student",
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("login@example.com");
  });
});
