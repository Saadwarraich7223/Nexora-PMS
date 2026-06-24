import request from "supertest";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";
import { createStudentWithAgent } from "../helpers/auth.js";
import User from "../../src/models/user.model.js";

let app;

const createRoleAgent = async (role) => {
  const email = `${role}.rbac@example.com`;
  await User.create({
    name: `${role} user`,
    email,
    password: "secret123",
    role,
    department: "CS",
    semester: 8,
  });

  const agent = request.agent(app);
  const loginRes = await agent.post("/api/auth/login").send({
    email,
    password: "secret123",
    role,
  });
  expect(loginRes.status).toBe(200);
  return agent;
};

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

describe("RBAC route protection", () => {
  test("student cannot access admin routes", async () => {
    const { agent: studentAgent } = await createStudentWithAgent(app, {
      registrationNumber: "REG-RBAC-1001",
      email: "student.rbac@example.com",
      name: "Student RBAC",
    });

    const res = await studentAgent.get("/api/admin/teachers");
    expect(res.status).toBe(403);
  });

  test("student cannot access teacher routes", async () => {
    const { agent: studentAgent } = await createStudentWithAgent(app, {
      registrationNumber: "REG-RBAC-1002",
      email: "student2.rbac@example.com",
      name: "Student RBAC 2",
    });

    const res = await studentAgent.get("/api/teacher/groups/assigned");
    expect(res.status).toBe(403);
  });

  test("teacher cannot access admin routes", async () => {
    const teacherAgent = await createRoleAgent("teacher");
    const res = await teacherAgent.get("/api/admin/teachers");
    expect(res.status).toBe(403);
  });

  test("admin cannot access student routes", async () => {
    const adminAgent = await createRoleAgent("admin");
    const res = await adminAgent.get("/api/student/groups");
    expect(res.status).toBe(403);
  });

  test("unauthenticated user gets 401 on protected route (edge case)", async () => {
    const res = await request(app).get("/api/admin/teachers");
    expect(res.status).toBe(401);
  });
});

