import Group from "../../models/group.model.js";
import Request from "../../models/request.model.js";
import User from "../../models/user.model.js";
import ApiError from "../../utils/apiError.js";
import * as supervisorService from "./supervisor.service.js";
import * as notificationService from "../notification.service.js";
import { buildPaginationMeta, normalizePagination } from "../../utils/pagination.js";

export const adminReviewGroup = async ({ groupId, approve }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  group.status = approve ? "active" : "rejected";
  await group.save();
  return group;
};

export const listGroupsBasedOnFilters = async ({ status, page, limit } = {}) => {
  const filter = {};
  const allowedStatuses = ["active", "pending", "rejected", "draft"];

  if (status && allowedStatuses.includes(status)) {
    filter.status = status;
  } else if (!status) {
    // By default, don't show draft groups to admin
    filter.status = { $in: ["active", "pending", "rejected"] };
  }

  const shouldPaginate = page !== undefined || limit !== undefined;

  if (!shouldPaginate) {
    const groups = await Group.find(filter)
      .populate("supervisor", "name department semester")
      .populate("members.user", "name email")
      .populate("project", "title status")
      .sort({ createdAt: -1 })
      .lean();

    return {
      groups,
      pagination: buildPaginationMeta({
        total: groups.length,
        page: 1,
        limit: groups.length || 1,
      }),
    };
  }

  const pagination = normalizePagination({ page, limit, defaultLimit: 20 });

  const [groups, total] = await Promise.all([
    Group.find(filter)
      .populate("supervisor", "name department semester")
      .populate("members.user", "name email")
      .populate("project", "title status")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Group.countDocuments(filter),
  ]);

  return {
    groups,
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

export const approveGroup = async (groupId) =>
  adminReviewGroup({ groupId, approve: true });

export const rejectGroup = async (groupId) =>
  adminReviewGroup({ groupId, approve: false });

export const deleteGroupById = async (user, groupId) => {
  const group = await Group.findById(groupId);

  if (!group) throw new ApiError(404, "Group not found");

  if (user.role !== "admin") {
    throw new ApiError(400, "Only the  admin can delete this group");
  }

  await User.updateMany(
    { assignedGroups: groupId },
    { $pull: { assignedGroups: groupId } },
  );

  await User.updateMany(
    { activeGroup: groupId },
    { $unset: { activeGroup: "" } },
  );
  await group.deleteOne();
  return { deleted: true };
};

export const getGroupById = async (groupId) => {
  const group = await Group.findById(groupId)
    .populate("leader", "name email")
    .populate("project", "title description status")
    .populate({
      path: "members.user",
      select: "name email",
    })
    .populate("supervisor", "name email");
  if (!group) throw new ApiError(404, "Group not found");
  return group;
};

export const listSupervisorRequests = async ({ status = "pending", page, limit } = {}) => {
  const filter = { type: "supervisor_request" };
  const allowed = ["pending", "approved", "rejected", "cancelled"];
  if (status && allowed.includes(status)) {
    filter.status = status;
  }

  const shouldPaginate = page !== undefined || limit !== undefined;

  if (!shouldPaginate) {
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate("relatedEntity", "name department semester status supervisor members maxMembers description")
      .populate("from", "name email")
      .populate("metadata.supervisorId", "name email department supervisorCapacity assignedGroups")
      .populate("metadata.reviewedBy", "name email role");

    return {
      requests,
      pagination: buildPaginationMeta({
        total: requests.length,
        page: 1,
        limit: requests.length || 1,
      }),
    };
  }

  const pagination = normalizePagination({ page, limit, defaultLimit: 20 });

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .sort({ createdAt: -1 })
      .populate("relatedEntity", "name department semester status supervisor members maxMembers description")
      .populate("from", "name email")
      .populate("metadata.supervisorId", "name email department supervisorCapacity assignedGroups")
      .populate("metadata.reviewedBy", "name email role")
      .skip(pagination.skip)
      .limit(pagination.limit),
    Request.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: buildPaginationMeta({
      total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

export const reviewSupervisorRequest = async ({
  requestId,
  adminId,
  approve,
  reviewNote,
}) => {
  const request = await Request.findById(requestId);
  if (!request || request.type !== "supervisor_request") throw new ApiError(404, "Supervisor request not found");
  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be reviewed");
  }

  const group = await Group.findById(request.relatedEntity);
  if (!group) throw new ApiError(404, "Group not found");

  if (approve) {
    if (group.status !== "active") {
      throw new ApiError(400, "Only approved groups can get a supervisor");
    }
    if (group.supervisor) {
      throw new ApiError(400, "Group already has a supervisor");
    }

    await supervisorService.assignSupervisorToGroup({
      groupId: group._id,
      supervisorId: request.metadata.supervisorId,
    });
    request.status = "approved";
  } else {
    request.status = "rejected";
    await notificationService.createNotification({
      user: request.from,
      message: `Your supervisor request for group ${group.name} was rejected`,
      type: "rejection",
      priority: "medium",
    });
  }

  request.metadata.reviewedBy = adminId;
  request.metadata.reviewedAt = new Date();
  request.metadata.reviewNote = reviewNote || "";
  await request.save();

  return await Request.findById(request._id)
    .populate("relatedEntity", "name department semester status supervisor members maxMembers description")
    .populate("from", "name email")
    .populate("metadata.supervisorId", "name email department supervisorCapacity assignedGroups")
    .populate("metadata.reviewedBy", "name email role");
};
