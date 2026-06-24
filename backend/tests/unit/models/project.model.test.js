import mongoose from "mongoose";
import Project from "../../../src/models/project.model.js";

describe("Project model validation", () => {
  test("accepts valid project payload", () => {
    const project = new Project({
      group: new mongoose.Types.ObjectId(),
      title: "PMS Enhancement",
      description: "Detailed description for project validation testing.",
      status: "draft",
    });

    expect(project.validateSync()).toBeUndefined();
  });

  test("fails when title/description/group missing", () => {
    const project = new Project({});
    const err = project.validateSync();

    expect(err.errors.group).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.description).toBeDefined();
  });

  test("fails with invalid project status (edge case)", () => {
    const project = new Project({
      group: new mongoose.Types.ObjectId(),
      title: "Invalid Status",
      description: "This should fail with invalid status",
      status: "archived",
    });
    const err = project.validateSync();
    expect(err.errors.status).toBeDefined();
  });
});

