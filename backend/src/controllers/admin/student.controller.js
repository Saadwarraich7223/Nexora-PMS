import asyncHandler from "../../utils/asyncHandler.js";
import * as studentService from "../../services/admin/student.service.js";
import { logger } from '../../utils/logger.js';


const listStudents = asyncHandler(async (req, res) => {
  const { status, department, semester, search, page, limit } = req.query;

  if (status === "active") {
    const result = await studentService.listActiveStudents({
      department,
      semester,
      search,
      page,
      limit,
    });
    return res.json(result);
  }

  if (status === "preapproved") {
    const result = await studentService.listPreApprovedStudents({
      department,
      semester,
      isRegistered: false,
      page,
      limit,
    });
    return res.json(result);
  }

  const result = await studentService.listAllStudents({
    department,
    semester,
    search,
    page,
    limit,
  });
  return res.json(result);
});

const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getActiveStudentById(
    req.params.studentId,
  );
  logger.info(student);
  return res.json({ student });
});

export { listStudents, getStudentById };
