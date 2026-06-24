import asyncHandler from "../../utils/asyncHandler.js";
import * as teacherService from "../../services/admin/teacher.service.js";

const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacherAccount(req.body);
  res.status(201).json({ message: "Teacher created successfully", teacher });
});

const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await teacherService.listTeachers();

  res.json({ message: "Teachers fetched successfully", teachers });
});

const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.teacherId);
  res.json({ message: "Teacher fetched successfully", teacher });
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacherById({
    teacherId: req.params.teacherId,
    payload: req.body,
  });
  res.json({ message: "Teacher updated successfully", teacher });
});

const deleteTeacher = asyncHandler(async (req, res) => {
  const result = await teacherService.deleteTeacherById(req.params.teacherId);
  res.json({ message: "Teacher deleted successfully", result });
});

const updateTeacherCapacity = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacherCapacity({
    teacherId: req.params.teacherId,
    supervisorCapacity: req.body.supervisorCapacity,
  });

  res.json({ message: "Teacher capacity updated successfully", teacher });
});

const getAssignedGroups = asyncHandler(async (req, res) => {
  const groups = await teacherService.getTeacherGroups(req.params.teacherId);

  res.json({ message: "Groups fetched successfully", groups });
});

export {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  updateTeacherCapacity,
  deleteTeacher,
  getAssignedGroups,
};
