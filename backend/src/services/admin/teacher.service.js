import User from "../../models/user.model.js";
import Group from "../../models/group.model.js";
import ApiError from "../../utils/apiError.js";
import { buildTeacherWelcomeEmail, sendEmail } from "../email.service.js";
import { logger } from '../../utils/logger.js';


const sanitizeUser = (user) => {
  if (!user) return user;
  const data = user.toObject();
  delete data.password;
  return data;
};

// create a teacher account
const createTeacherAccount = async (payload) => {
  const { name, email, password, department, supervisorCapacity } = payload;

  const existing = await User.findOne({ email });

  if (existing) throw new ApiError(409, "User already exists");
  const teacher = await User.create({
    name,
    email,
    password,
    department,
    supervisorCapacity,
    role: "teacher",
  });

  try {
    const { subject, text, html } = buildTeacherWelcomeEmail({
      teacherName: name,
      teacherEmail: email,
      password,
    });
    await sendEmail({ to: email, subject, text, html }).then(() =>
      logger.info("email sent"),
    );
  } catch (error) {
    logger.error("Failed to send teacher credentials email:", error);
  }

  return sanitizeUser(teacher);
};

// List all teachers.
const listTeachers = async () => {
  const teachers = await User.find({ role: "teacher" }).select("-password");
  return teachers;
};

// Get a teacher by id.
const getTeacherById = async (teacherId) => {
  const teacher = await User.findById(teacherId)
    .select("-password")
    .populate("assignedGroups", "name department semester");
  if (!teacher || teacher.role !== "teacher")
    throw new ApiError(404, "Teacher not found");
  return teacher;
};

// Update a teacher profile.
const updateTeacherById = async ({ teacherId, payload }) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher")
    throw new ApiError(404, "Teacher not found");

  const allowed = [
    "name",
    "email",
    "department",
    "supervisorCapacity",
    "password",
  ];
  // TODO: Add schema validation for payload fields.
  allowed.forEach((field) => {
    if (payload[field] !== undefined) teacher[field] = payload[field];
  });

  await teacher.save();
  return sanitizeUser(teacher);
};

// Delete a teacher.
const deleteTeacherById = async (teacherId) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher")
    throw new ApiError(404, "Teacher not found");
  await teacher.deleteOne();
  return { deleted: true };
};

// Update supervision capacity.
const updateTeacherCapacity = async ({ teacherId, supervisorCapacity }) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher")
    throw new ApiError(404, "Teacher not found");

  teacher.supervisorCapacity = supervisorCapacity;
  await teacher.save();
  return sanitizeUser(teacher);
};

// Get groups assigned to teacher.
const getTeacherGroups = async (teacherId) => {
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "teacher")
    throw new ApiError(404, "Teacher not found");

  const groups = await Group.find({ supervisor: teacherId })
    .populate("students", "name email role")
    .populate("project");
  return groups;
};

export {
  createTeacherAccount,
  listTeachers,
  getTeacherById,
  updateTeacherById,
  deleteTeacherById,
  updateTeacherCapacity,
  getTeacherGroups,
};
