import User from "../../../src/models/user.model.js";

describe("User model validation", () => {
  test("accepts valid student payload", () => {
    const user = new User({
      name: "Valid Student",
      email: "valid.student@example.com",
      password: "secret123",
      registrationNumber: "REG-9001",
      role: "student",
      semester: 8,
      department: "CS",
    });

    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  test("fails when required fields are missing", () => {
    const user = new User({});
    const err = user.validateSync();

    expect(err.errors.name).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  test("fails when role is invalid (edge case)", () => {
    const user = new User({
      name: "Role Edge",
      email: "role.edge@example.com",
      password: "secret123",
      role: "manager",
    });

    const err = user.validateSync();
    expect(err.errors.role).toBeDefined();
  });
});

