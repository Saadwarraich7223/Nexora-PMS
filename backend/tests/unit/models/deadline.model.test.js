import mongoose from "mongoose";
import Deadline from "../../../src/models/deadline.model.js";

describe("Deadline model validation", () => {
  test("accepts valid deadline payload", () => {
    const deadline = new Deadline({
      name: "Demo Submission",
      dueDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
      project: new mongoose.Types.ObjectId(),
    });

    expect(deadline.validateSync()).toBeUndefined();
  });

  test("fails when required fields are missing", () => {
    const deadline = new Deadline({});
    const err = deadline.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.dueDate).toBeDefined();
    expect(err.errors.createdBy).toBeDefined();
    expect(err.errors.project).toBeDefined();
  });

  test("fails with invalid completion status enum (edge case)", () => {
    const deadline = new Deadline({
      name: "Edge deadline",
      dueDate: new Date(),
      createdBy: new mongoose.Types.ObjectId(),
      project: new mongoose.Types.ObjectId(),
      completionStatus: "late-ish",
    });
    const err = deadline.validateSync();
    expect(err.errors.completionStatus).toBeDefined();
  });
});

