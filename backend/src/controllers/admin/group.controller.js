import * as groupService from "../../services/admin/group.service.js";
import * as supervisorService from "../../services/admin/supervisor.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";

const getGroupsBasedOnFilters = asyncHandler(async (req, res) => {
  const { groups, pagination } = await groupService.listGroupsBasedOnFilters({
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.json({ message: "Groups fetched successfully", groups, pagination });
});

const getGroupById = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.groupId);
  res.json({ message: "Group fetched successfully", group });
});

const approveGroupCreation = asyncHandler(async (req, res) => {
  const group = await groupService.approveGroup(req.params.groupId);
  res.json({ message: "Group approved successfully", group });
});

const rejectGroupCreation = asyncHandler(async (req, res) => {
  const group = await groupService.rejectGroup(req.params.groupId);
  res.json({ message: "Group rejected successfully", group });
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroupById({
    userId: req.user._id,
    groupId: req.params.groupId,
    payload: req.body,
  });
  res.json({ message: "Group updated successfully", group });
});

const deletGroupById = asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    throw new ApiError(401, "Unauthorized");
  }
  await groupService.deleteGroupById(req.user, req.params.groupId);
  res.json({ message: "Group deleted successfully" });
});

const assignSupervisor = asyncHandler(async (req, res) => {
  const group = await supervisorService.assignSupervisorToGroup({
    groupId: req.params.groupId,
    supervisorId: req.body.supervisorId,
  });

  res.json({ message: "Supervisor assigned to the group", group });
});

const listSupervisorRequests = asyncHandler(async (req, res) => {
  const { requests, pagination } = await groupService.listSupervisorRequests({
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });
  res.json({
    message: "Supervisor requests fetched successfully",
    requests,
    pagination,
  });
});

const reviewSupervisorRequest = asyncHandler(async (req, res) => {
  const { approve, reviewNote } = req.body;
  if (typeof approve !== "boolean") {
    throw new ApiError(400, "approve must be a boolean");
  }
  const request = await groupService.reviewSupervisorRequest({
    requestId: req.params.requestId,
    adminId: req.user._id,
    approve,
    reviewNote,
  });

  res.json({
    message: `Supervisor request ${approve ? "approved" : "rejected"} successfully`,
    request,
  });
});

export {
  getGroupsBasedOnFilters,
  getGroupById,
  approveGroupCreation,
  rejectGroupCreation,
  updateGroup,
  deletGroupById,
  assignSupervisor,
  listSupervisorRequests,
  reviewSupervisorRequest,
};
