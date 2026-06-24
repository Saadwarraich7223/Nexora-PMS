import mongoose from "mongoose";
import Task from "../../../src/models/task.model.js";

describe("Task model validation", () => {
  test("accepts valid task payload", () => {
    const task = new Task({
      title: "Implement API",
      description: "Create endpoint and tests",
      group: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      priority: "high",
      status: "todo",
    });

    expect(task.validateSync()).toBeUndefined();
  });

  test("fails when required fields are missing", () => {
    const task = new Task({});
    const err = task.validateSync();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
    expect(err.errors.group).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
  });

  test("fails with invalid status enum (edge case)", () => {
    const task = new Task({
      title: "Bad Status",
      description: "Invalid enum",
      group: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      status: "blocked",
    });
    const err = task.validateSync();
    expect(err.errors.status).toBeDefined();
  });
});

