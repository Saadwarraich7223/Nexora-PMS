import request from "supertest";
import { createPreApprovedStudent } from "./factories.js";

const unique = () => `${Date.now()}-${Math.round(Math.random() * 1e6)}`;

export const registerStudent = async (app, overrides = {}) => {
  const suffix = unique();
  const registrationNumber = overrides.registrationNumber || `REG-${suffix}`;
  const department = overrides.department || "CS";
  const semester = overrides.semester || 8;

  await createPreApprovedStudent({
    registrationNumber,
    department,
    semester,
  });

  const payload = {
    registrationNumber,
    name: overrides.name || "Test Student",
    email: overrides.email || `student-${suffix}@example.com`,
    password: overrides.password || "secret123",
  };

  const res = await request(app).post("/api/auth/register").send(payload);
  if (res.status !== 201) {
    throw new Error(`registerStudent failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { res, payload };
};

export const loginStudent = async (app, overrides = {}) => {
  const email = overrides.email;
  const password = overrides.password || "secret123";
  if (!email) {
    throw new Error("loginStudent requires overrides.email");
  }

  const res = await request(app).post("/api/auth/login").send({
    email,
    password,
    role: "student",
  });

  return res;
};

export const getStudentAgent = async (app, overrides = {}) => {
  const { payload } = await registerStudent(app, overrides);
  const agent = request.agent(app);

  const loginRes = await agent.post("/api/auth/login").send({
    email: overrides.email || payload.email,
    password: overrides.password || "secret123",
    role: "student",
  });
  if (loginRes.status !== 200) {
    throw new Error(`getStudentAgent login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
  }

  return agent;
};

export const createStudentWithAgent = async (app, overrides = {}) => {
  const { res } = await registerStudent(app, overrides);
  const agent = request.agent(app);

  const loginRes = await agent.post("/api/auth/login").send({
    email: overrides.email || res.body?.user?.email,
    password: overrides.password || "secret123",
    role: "student",
  });
  if (loginRes.status !== 200) {
    throw new Error(
      `createStudentWithAgent login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`,
    );
  }

  return { agent, user: res.body.user };
};
