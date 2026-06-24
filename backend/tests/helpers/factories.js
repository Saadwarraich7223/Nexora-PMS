export const createPreApprovedStudent = async (overrides = {}) => {
  const { default: PreApprovedStudent } = await import(
    "../../src/models/PreApprovedStudent.model.js"
  );

  const data = {
    registrationNumber: "REG-1001",
    department: "CS",
    semester: 8,
    isRegistered: false,
    ...overrides,
  };

  return await PreApprovedStudent.create(data);
};
