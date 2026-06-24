import mongoose from "mongoose";
import Notification from "../../../src/models/notification.model.js";

describe("Notification model validation", () => {
  test("accepts valid notification payload", () => {
    const notification = new Notification({
      user: new mongoose.Types.ObjectId(),
      title: "Task Reminder",
      message: "Please complete your assigned task",
      type: "task",
      priority: "medium",
    });

    expect(notification.validateSync()).toBeUndefined();
  });

  test("fails when required fields are missing", () => {
    const notification = new Notification({});
    const err = notification.validateSync();
    expect(err.errors.user).toBeDefined();
    expect(err.errors.message).toBeDefined();
  });

  test("fails with invalid priority enum (edge case)", () => {
    const notification = new Notification({
      user: new mongoose.Types.ObjectId(),
      message: "Edge priority",
      priority: "urgent",
    });
    const err = notification.validateSync();
    expect(err.errors.priority).toBeDefined();
  });
});

