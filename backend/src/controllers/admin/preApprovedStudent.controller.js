import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import * as preApprovedStudentsService from "../../services/admin/preApproved.service.js";
import { logger } from '../../utils/logger.js';


// Admin can upload a csv file of bulk students registeration numbers , department and semester - students can latter enter their credentails with thier registration number to activate their account
const uploadPreApprovedStudents = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "CSV file required");
  logger.info("req.file:", req.file);

  const preApprovedStudentsList =
    await preApprovedStudentsService.parseCsvAndStore(req.file.path);

  res.status(201).json({ message: "CSV processed", preApprovedStudentsList });
});

// Admin can fetch all the preApprovedStudents-filters:based on account activation , semester , department
const fetchPreApprovedList = asyncHandler(async (req, res) => {
  const preApprovedStudentsList =
    await preApprovedStudentsService.getPreApprovedStudentsList(req.query);

  return res.status(200).json({
    message: "PreApprovedStudentsList fetched successfully",
    preApprovedStudentsList,
  });
});

// Update a pre-approved student entry.
const updatePreApprovedStudent = asyncHandler(async (req, res) => {
  const student = await preApprovedStudentsService.updatePreApprovedStudentById(
    req.params.id,
    req.body,
  );

  res
    .status(200)
    .json({ message: "PreApproved student updated successfully", student });
});

// Delete a pre-approved student entry.
const deletePreApprovedStudent = asyncHandler(async (req, res) => {
  const student = await preApprovedStudentsService.deletePreApprovedStudentById(
    req.params.id,
  );
  res.json({ message: "PreApproved student deleted successfully", student });
});

// Clear all pre-approved students.
const clearPreApproved = asyncHandler(async (_req, res) => {
  const result = await preApprovedStudentsService.clearPreApprovedStudents();
  res.json({ message: "PreApproved students cleared successfully", result });
});

export {
  uploadPreApprovedStudents,
  updatePreApprovedStudent,
  fetchPreApprovedList,
  deletePreApprovedStudent,
  clearPreApproved,
};
