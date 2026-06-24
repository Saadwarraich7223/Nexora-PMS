import mongoose from "mongoose";
import Group from "../../../src/models/group.model.js";

describe("Group model validation", () => {
  test("accepts valid group payload", () => {
    const group = new Group({
      name: "Group Validation",
      leader: new mongoose.Types.ObjectId(),
      department: "CS",
      semester: 8,
      maxMembers: 4,
      status: "pending",
    });

    const err = group.validateSync();
    expect(err).toBeUndefined();
  });

  test("fails when required fields are missing", () => {
    const group = new Group({ name: "Missing Leader" });
    const err = group.validateSync();

    expect(err.errors.leader).toBeDefined();
    expect(err.errors.department).toBeDefined();
    expect(err.errors.semester).toBeDefined();
  });

  test("fails when status is outside enum (edge case)", () => {
    const group = new Group({
      name: "Bad Status Group",
      leader: new mongoose.Types.ObjectId(),
      department: "CS",
      semester: 8,
      status: "archived",
    });
    const err = group.validateSync();

    expect(err.errors.status).toBeDefined();
  });
});

