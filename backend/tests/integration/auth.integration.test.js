import request from "supertest";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";

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

describe("Auth Service Integration", () => {
  test("rejects registration if not pre-approved", async () => {
    const res = await request(app).post("/api/auth/register").send({
      registrationNumber: "REG-9999",
      name: "No Approval",
      email: "no-approval@example.com",
      password: "secret123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message || res.body.error || res.body.status).toBeDefined();
  });
});
