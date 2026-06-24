import request from "supertest";
import { connectTestDB, clearTestDB, disconnectTestDB } from "../helpers/db.js";
import { getTestApp } from "../helpers/app.js";
import { createStudentWithAgent } from "../helpers/auth.js";
import Notification from "../../src/models/notification.model.js";

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

describe("Notification routes", () => {
  test("GET /api/notifications returns notifications for logged-in user", async () => {
    const { agent, user } = await createStudentWithAgent(app, {
      registrationNumber: "REG-N-1001",
      email: "notif.list@example.com",
      name: "Notif List",
    });

    await Notification.create({
      user: user._id,
      title: "Reminder",
      message: "Complete your task",
      type: "task",
      priority: "medium",
    });

    const res = await agent.get("/api/notifications");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  test("PATCH /api/notifications/:id/read marks a notification as read", async () => {
    const { agent, user } = await createStudentWithAgent(app, {
      registrationNumber: "REG-N-1002",
      email: "notif.read@example.com",
      name: "Notif Read",
    });

    const created = await Notification.create({
      user: user._id,
      title: "Action Needed",
      message: "Please check updates",
      type: "general",
      priority: "low",
    });

    const res = await agent.patch(`/api/notifications/${created._id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  test("PATCH /api/notifications/:id/read fails on unknown id (edge case)", async () => {
    const { agent } = await createStudentWithAgent(app, {
      registrationNumber: "REG-N-1003",
      email: "notif.unknown@example.com",
      name: "Notif Unknown",
    });

    const res = await agent.patch("/api/notifications/507f1f77bcf86cd799439011/read");
    expect(res.status).toBe(404);
  });

  test("GET /api/notifications fails without authentication", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});

