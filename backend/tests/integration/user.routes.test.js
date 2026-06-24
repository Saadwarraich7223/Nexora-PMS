import request from "supertest";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";
import { createStudentWithAgent } from "../helpers/auth.js";

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

describe("User routes", () => {
  test("GET /api/users/me returns profile for authenticated user", async () => {
    const { agent } = await createStudentWithAgent(app, {
      registrationNumber: "REG-U-1001",
      email: "user.me@example.com",
      name: "User Me",
      department: "CS",
      semester: 8,
    });

    const res = await agent.get("/api/users/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user.me@example.com");
  });

  test("PATCH /api/users/me updates allowed fields", async () => {
    const { agent } = await createStudentWithAgent(app, {
      registrationNumber: "REG-U-1002",
      email: "user.update@example.com",
      name: "Before Name",
      department: "CS",
      semester: 8,
    });

    const res = await agent.patch("/api/users/me").send({ name: "After Name", semester: 4 });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("After Name");
    expect(res.body.user.semester).toBe(4);
  });

  test("PATCH /api/users/me fails when no valid fields are sent", async () => {
    const { agent } = await createStudentWithAgent(app, {
      registrationNumber: "REG-U-1003",
      email: "user.invalid.update@example.com",
      name: "No Update",
      department: "CS",
      semester: 8,
    });

    const res = await agent.patch("/api/users/me").send({ unknownField: "x" });
    expect(res.status).toBe(400);
    expect(String(res.body.message || "").toLowerCase()).toContain("no valid fields");
  });

  test("GET /api/users/me fails for unauthenticated request", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(String(res.body.message || "").toLowerCase()).toContain("authentication required");
  });
});

