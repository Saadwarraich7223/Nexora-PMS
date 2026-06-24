import fs from "fs";
import ApiError from "../../utils/apiError.js";
import csvParser from "csv-parser";
import PreApprovedStudent from "../../models/PreApprovedStudent.model.js";

//  Services being used in PreApprovedStudents.controller.js
// CSV parsing and persistence for pre-approved students.
// Parse a CSV file and upsert pre-approved student records.

const parseCsvAndStore = async (filePath) => {
  if (!fs.existsSync(filePath)) throw new ApiError(400, "CSV file is missing");

  const records = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        if (row.registrationNumber && row.department && row.semester) {
          records.push({
            registrationNumber: String(row.registrationNumber).trim().toUpperCase(),
            department: String(row.department).trim(),
            semester: Number(row.semester),
          });
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (records.length === 0) throw new ApiError(400, "No valid records found");

  const bulkOps = records.map((rec) => ({
    updateOne: {
      filter: { registrationNumber: rec.registrationNumber },
      update: { $setOnInsert: rec },
      upsert: true,
    },
  }));

  await PreApprovedStudent.bulkWrite(bulkOps);

  return { inserted: records.length };
};

// Get a pre-approved students
const getPreApprovedStudentsList = async (query) => {
  const filter = {};

  // Filter by registration status
  if (query.isRegistered !== undefined) {
    filter.isRegistered = query.isRegistered === "true";
  }

  // Filter by department
  if (query.department) {
    filter.department = query.department;
  }

  // Filter by semester
  if (query.semester) {
    filter.semester = Number(query.semester);
  }

  const preApprovedStudentsList = await PreApprovedStudent.find(filter);

  return preApprovedStudentsList;
};

// Update a pre-approved student.
const updatePreApprovedStudentById = async (id, payload) => {
  const student = await PreApprovedStudent.findById(id);
  if (!student) throw new ApiError(404, "Pre-approved student not found");

  const allowed = [
    "registrationNumber",
    "department",
    "semester",
    "isRegistered",
  ];

  allowed.forEach((field) => {
    if (payload[field] !== undefined) student[field] = payload[field];
  });

  await student.save();
  return student;
};

// Delete a pre-approved student.
const deletePreApprovedStudentById = async (id) => {
  const student = await PreApprovedStudent.findByIdAndDelete(id);
  if (!student) throw new ApiError(404, "Pre-approved student not found");
  return { deleted: true };
};

// Clear all pre-approved students.
const clearPreApprovedStudents = async () => {
  const result = await PreApprovedStudent.deleteMany({});
  return { deletedCount: result.deletedCount };
};

export {
  parseCsvAndStore,
  getPreApprovedStudentsList,
  updatePreApprovedStudentById,
  deletePreApprovedStudentById,
  clearPreApprovedStudents,
};
