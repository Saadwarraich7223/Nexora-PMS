import User from "../../models/user.model.js";
import ApiError from "../../utils/apiError.js";
import * as preApprovedService from "./preApproved.service.js";
import { logger } from "../../utils/logger.js";
import {
  buildPaginationMeta,
  normalizePagination,
} from "../../utils/pagination.js";

const buildStudentFilters = ({ department, semester, search }) => {
  const filter = { role: "student" };
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (search) {
    const q = String(search).trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { registrationNumber: { $regex: q, $options: "i" } },
      ];
    }
  }
  return filter;
};

export const listActiveStudents = async ({
  department,
  semester,
  search,
  page,
  limit,
  maxLimit,
}) => {
  const filter = buildStudentFilters({ department, semester, search });
  const shouldPaginate = page !== undefined || limit !== undefined;

  if (!shouldPaginate) {
    const students = await User.find(filter)
      .select(
        "name email registrationNumber department semester activeGroup createdAt",
      )
      .populate({
        path: "activeGroup",
        select: "name status supervisor members",
        populate: { path: "supervisor", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      students: students.map((student) => ({
        ...student,
        source: "active",
        isRegistered: true,
      })),
      pagination: buildPaginationMeta({
        total: students.length,
        page: 1,
        limit: students.length || 1,
      }),
    };
  }

  const pagination = normalizePagination({
    page,
    limit,
    defaultLimit: 20,
    maxLimit,
  });

  const [students, total] = await Promise.all([
    User.find(filter)
      .select(
        "name email registrationNumber department semester activeGroup createdAt",
      )
      .populate({
        path: "activeGroup",
        select: "name status supervisor members",
        populate: { path: "supervisor", select: "name" },
      })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    students: students.map((student) => ({
      ...student,
      source: "active",
      isRegistered: true,
    })),
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

const paginateArray = (items, { page, limit, maxLimit }) => {
  const pagination = normalizePagination({
    page,
    limit,
    defaultLimit: 20,
    maxLimit,
  });
  const total = items.length;
  const paginatedItems = items.slice(
    pagination.skip,
    pagination.skip + pagination.limit,
  );

  return {
    items: paginatedItems,
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

export const listPreApprovedStudents = async ({
  department,
  semester,
  isRegistered,
  page,
  limit,
  maxLimit,
}) => {
  const preApproved = await preApprovedService.getPreApprovedStudentsList({
    department,
    semester,
    isRegistered,
  });

  const normalized = preApproved.map((item) => {
    const entry = item?.toObject ? item.toObject() : item;
    return {
      ...entry,
      source: "preapproved",
      isRegistered: entry.isRegistered ?? false,
    };
  });

  const shouldPaginate = page !== undefined || limit !== undefined;
  if (!shouldPaginate) {
    return {
      students: normalized,
      pagination: buildPaginationMeta({
        total: normalized.length,
        page: 1,
        limit: normalized.length || 1,
      }),
    };
  }

  const { items, pagination } = paginateArray(normalized, {
    page,
    limit,
    maxLimit,
  });

  return {
    students: items,
    pagination,
  };
};

export const listAllStudents = async (params) => {
  const baseParams = {
    department: params.department,
    semester: params.semester,
    search: params.search,
    isRegistered: params.isRegistered,
  };

  const [active, preapproved] = await Promise.all([
    listActiveStudents(baseParams),
    listPreApprovedStudents(baseParams),
  ]);

  // Filter out preapproved students who are already in the active list
  const activeRegNumbers = new Set(active.students.map((s) => s.registrationNumber));
  const uniquePreapproved = preapproved.students.filter(
    (s) => !activeRegNumbers.has(s.registrationNumber),
  );

  const combined = [...active.students, ...uniquePreapproved];
  combined.sort((a, b) => {
    if (a.source === "active" && b.source !== "active") return -1;
    if (a.source !== "active" && b.source === "active") return 1;
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const shouldPaginate =
    params.page !== undefined || params.limit !== undefined;

  if (!shouldPaginate) {
    return {
      students: combined,
      pagination: buildPaginationMeta({
        total: combined.length,
        page: 1,
        limit: combined.length || 1,
      }),
    };
  }

  const { items, pagination } = paginateArray(combined, {
    page: params.page,
    limit: params.limit,
    maxLimit: params.maxLimit,
  });

  return {
    students: items,
    pagination,
  };
};

export const getActiveStudentById = async (studentId) => {
  const student = await User.findById(studentId)
    .select(
      "name email registrationNumber department semester activeGroup createdAt role",
    )
    .populate({
      path: "activeGroup",
      select: "name status project supervisor members ",
      populate: [
        { path: "project", select: "title status description" },
        { path: "supervisor", select: "name email" },
      ],
    });
  logger.info(student);
  if (!student || student.role !== "student") {
    throw new ApiError(404, "Student not found");
  }

  return student;
};
