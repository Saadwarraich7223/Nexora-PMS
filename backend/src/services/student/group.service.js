import Group from "../../models/group.model.js";
import Request from "../../models/request.model.js";
import User from "../../models/user.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";
import { sendEmail } from "../email.service.js";
import Project from "../../models/project.model.js";
import { logger } from '../../utils/logger.js';


const getLeaderGroupForSupervisorRequest = async (leaderId) => {
  const leader = await User.findById(leaderId);
  if (!leader || !leader.activeGroup) {
    throw new ApiError(400, "You must be in an active group");
  }

  const group = await Group.findById(leader.activeGroup);
  if (!group) throw new ApiError(404, "Group not found");
  if (!group.leader.equals(leaderId)) {
    throw new ApiError(
      403,
      "Only the group leader can manage supervisor requests",
    );
  }
  if (group.status !== "active") {
    throw new ApiError(
      400,
      "Only approved groups can request a supervisor assignment",
    );
  }
  if (group.supervisor) {
    throw new ApiError(400, "Group already has an assigned supervisor");
  }

  return { leader, group };
};

const createGroup = async ({ createrId, name }) => {
  const student = await User.findById(createrId);
  if (student.role !== "student")
    throw new ApiError("Only students can create groups");
  if (student.activeGroup)
    throw new ApiError(400, "You are already in a group");

  const group = await Group.create({
    name,
    department: student.department,
    semester: student.semester,
    leader: student._id,
    members: [{ user: student._id }],
  });

  student.activeGroup = group._id;
  await student.save();

  return group;
};

const inviteStudent = async ({ groupId, senderId, receiverId }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(400, "Group not found");

  if (!group.leader.equals(senderId))
    throw new ApiError(403, "Only group leader can invite");

  if (group.members.length >= group.maxMembers) {
    throw new ApiError(400, "Cannot send request , Group is full");
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) throw new ApiError(404, "Student not found");
  if (receiver.activeGroup) {
    throw new ApiError(400, "Student already in a group");
  }
  if (
    receiver.department !== group.department ||
    receiver.semester !== group.semester
  ) {
    throw new ApiError(400, "Department/semester mismatch");
  }

  const existing = await Request.findOne({
    type: "group_invite",
    relatedEntity: groupId,
    to: receiverId,
    status: "pending",
  });

  if (existing) throw new ApiError(409, "Invite already sent to this student");
  const invite = await Request.create({
    type: "group_invite",
    from: senderId,
    to: receiverId,
    relatedEntity: groupId,
    relatedModel: "Group",
  });

  await sendEmail({
    to: receiver.email,
    subject: "Group invitation",
    text: `You have been invited to join group ${group.name}.`,
  });

  await notificationService.createNotification({
    user: receiverId,
    message: `You have been invited to join group ${group.name}`,
    type: "request",
    link: `/groups/invites`,
    priority: "medium",
  });

  return invite;
};

const respondInvite = async ({ inviteId, receiverId, accept }) => {
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new ApiError(404, "Student not found");
  if (receiver.activeGroup) {
    throw new ApiError(400, "Student already in a group");
  }
  const invite = await Request.findById(inviteId);
  if (!invite || invite.type !== "group_invite") throw new ApiError(404, "Invite not found");

  if (invite.status !== "pending") {
    throw new ApiError(400, "Invite already handled");
  }
  const group = await Group.findById(invite.relatedEntity);

  if (!group) throw new ApiError(404, "Group not found");
  if (!accept) {
    invite.status = "rejected";
    await invite.save();

    await notificationService.createNotification({
      user: group.leader,
      message: `${receiver.name} has rejected your group invitation`,
      type: "rejection",
      priority: "medium",
    });

    return invite;
  }

  if (group.members.length >= group.maxMembers) {
    throw new ApiError(400, "Group is full");
  }

  group.members.push({ user: receiverId });
  await group.save();

  receiver.activeGroup = group._id;
  await receiver.save();

  invite.status = "accepted";
  await invite.save();

  await notificationService.createNotification({
    user: group.leader,
    message: `${receiver.name} has ${accept ? "accepted" : "rejected"} your group invitation`,
    type: accept ? "approval" : "rejection",
    priority: "medium",
  });

  return invite;
};

const requestToJoin = async ({ groupId, senderId }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (group.members.length >= group.maxMembers) {
    throw new ApiError(400, "Group is full");
  }
  const sender = await User.findById(senderId);
  if (!sender) throw new ApiError(404, "Student not found");
  if (sender.activeGroup) throw new ApiError(400, "Student already in a group");
  if (
    sender.department !== group.department ||
    sender.semester !== group.semester
  ) {
    throw new ApiError(400, "Department/semester mismatch");
  }

  const existing = await Request.findOne({
    type: "group_join",
    relatedEntity: groupId,
    from: senderId,
    status: "pending",
  });
  if (existing) throw new ApiError(409, "Request already sent");

  const request = await Request.create({
    type: "group_join",
    from: senderId,
    relatedEntity: groupId,
    relatedModel: "Group",
  });

  await notificationService.createNotification({
    user: group.leader,
    message: `${sender.name} has requested to join your group ${group.name}`,
    type: "request",
    link: `/groups/requests`,
    priority: "medium",
  });

  return request;
};

const respondJoinRequest = async ({ requestId, leaderId, accept }) => {
  const request = await Request.findById(requestId);
  if (!request || request.type !== "group_join") throw new ApiError(404, "Join request not found");
  if (request.status !== "pending")
    throw new ApiError(400, "Request already handled");

  const group = await Group.findById(request.relatedEntity);
  if (!group) throw new ApiError(404, "Group not found");
  if (String(group.leader) !== String(leaderId)) {
    throw new ApiError(403, "Only leader can respond");
  }

  if (!accept) {
    request.status = "rejected";
    await request.save();

    await notificationService.createNotification({
      user: request.sender,
      message: `Your request to join group ${group.name} has been rejected`,
      type: "rejection",
      priority: "medium",
    });

    return request;
  }

  if (group.members.length >= group.maxMembers) {
    throw new ApiError(400, "Group is full");
  }

  const sender = await User.findById(request.sender);
  if (!sender) throw new ApiError(404, "Student not found");
  if (sender.activeGroup) throw new ApiError(400, "Student already in a group");

  group.members.push({ user: sender._id });
  await group.save();

  sender.activeGroup = group._id;
  await sender.save();

  request.status = "accepted";
  await request.save();

  await notificationService.createNotification({
    user: request.sender,
    message: `Your request to join group ${group.name} has been ${accept ? "accepted" : "rejected"}`,
    type: accept ? "approval" : "rejection",
    priority: "high",
  });

  return request;
};

const submitForApproval = async ({ groupId, leaderId }) => {
  const group = await Group.findById(groupId);

  if (!group) throw new ApiError(404, "Group not found");
  
  if (group.status === "active") {
    throw new ApiError(400, "Group is already active");
  }
  
  if (group.status === "pending") {
    throw new ApiError(400, "Group is already awaiting approval");
  }

  if (String(group.leader) !== String(leaderId)) {
    throw new ApiError(403, "Only leader can submit request for approval");
  }
  
  if (group.members.length < 2) {
    throw new ApiError(400, "Group must have at least 2 members");
  }

  group.status = "pending";
  await group.save();

  // Create notifications for all admins
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user: admin._id,
        message: `New group "${group.name}" is awaiting your approval.`,
        type: "request",
        link: `/groups`,
        priority: "high",
      }),
    ),
  );

  return group;
};

const getStudentGroup = async (user) => {
  const group = await Group.findById(user.activeGroup)
    .populate("project")
    .populate({
      path: "members.user",
      select: "name email department semester",
    })
    .populate("supervisor", "name email")
    .populate("leader", "name email")
    .lean();
  if (!group) throw new ApiError(404, "Group not found");
  return group;
};

const getStudentGroupInvites = async (studentId) => {
  const invites = await Request.find({
    type: "group_invite",
    to: studentId,
    status: "pending",
  })
    .populate("relatedEntity", "name department semester")
    .populate("from", "name email");
  return invites;
};

const getGroupJoinRequests = async (leaderId) => {
  const leader = await User.findById(leaderId);
  if (!leader || !leader.activeGroup) {
    throw new ApiError(400, "You don't have an active group");
  }

  const group = await Group.findById(leader.activeGroup);

  if (!group.leader.equals(leaderId)) {
    throw new ApiError(403, "Only the group leader can view join requests");
  }

  const requests = await Request.find({
    type: "group_join",
    relatedEntity: group._id,
    status: "pending",
  }).populate("from", "name email department semester");

  return requests;
};

const getGroupById = async (groupId) => {
  const group = await Group.findById(groupId)
    .populate("project", "title description")
    .populate({
      path: "members.user",
      select: "name email",
    })
    .populate("supervisor", "name email");
  if (!group) throw new ApiError(404, "Group not found");
  return group;
};

const deleteGroup = async (leader) => {
  if (!leader.activeGroup) {
    throw new ApiError(400, "You don't have an active group");
  }
  const group = await Group.findById(leader.activeGroup);

  if (!group) throw new ApiError(404, "Group not found");

  if (!group.leader.equals(leader._id)) {
    throw new ApiError(
      400,
      "Only the leader of this group can delete the group",
    );
  }

  if (group.status === "active") {
    throw new ApiError(400, "Cannot delete a group that is already active");
  }

  // Remove group from all users
  await Promise.all([
    User.updateMany(
      { assignedGroups: group._id },
      { $pull: { assignedGroups: group._id } },
    ),
    User.updateMany(
      { activeGroup: group._id },
      { $unset: { activeGroup: "" } },
    ),
  ]);
  if (group.project) {
    await Project.findByIdAndDelete(group.project);
  }
  await group.deleteOne();
  return { deleted: true };
};

const updateGroup = async ({ user, payload }) => {
  if (!user.activeGroup) {
    throw new ApiError(400, "You don't have an active group");
  }

  if (!payload || typeof payload !== "object") {
    throw new ApiError(400, "Invalid payload");
  }

  const group = await Group.findById(user.activeGroup);
  if (!group) throw new ApiError(404, "Group not found");

  if (!group.leader.equals(user._id)) {
    throw new ApiError(
      400,
      "Only the leader of this group can update the group",
    );
  }

  const allowed = ["name", "semester", "department", "description"];
  let updated = false;

  allowed.forEach((field) => {
    if (payload[field] !== undefined) {
      group[field] = payload[field];
      updated = true;
    }
  });

  if (!updated) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  await group.save();
  return group;
};

// Fetch all groups that belong to the same department and semester as the given student
const getAllGroups = async ({ user }) => {
  const groups = await Group.find({
    department: user.department,
    semester: user.semester,
  });
  return groups;
};

// Fetch all students who are in the same department and semester as the given student
const getAllStudents = async ({ user }) => {
  const students = await User.find({
    role: "student",
    department: user.department,
    semester: user.semester,
  });
  return students;
};

const listAvailableSupervisors = async (leaderId) => {
  const { group } = await getLeaderGroupForSupervisorRequest(leaderId);
  logger.info(group.department);
  const supervisors = await User.find({
    role: "teacher",
    department: group.department,
  }).select("name email department supervisorCapacity assignedGroups");
  logger.info(supervisors);
  const supervisorIds = supervisors.map((supervisor) => supervisor._id);

  const groupedCounts =
    supervisorIds.length > 0
      ? await Group.aggregate([
          { $match: { supervisor: { $in: supervisorIds } } },
          { $group: { _id: "$supervisor", count: { $sum: 1 } } },
        ])
      : [];

  const assignedCountMap = new Map(
    groupedCounts.map((entry) => [String(entry._id), entry.count]),
  );

  const enriched = supervisors.map((supervisor) => {
    const assignedCount = assignedCountMap.get(String(supervisor._id)) || 0;
    const capacity = supervisor.supervisorCapacity || 0;

    return {
      _id: supervisor._id,
      name: supervisor.name,
      email: supervisor.email,
      department: supervisor.department,
      capacity,
      assignedCount,
      availability: Math.max(capacity - assignedCount, 0),
    };
  });

  logger.info(enriched);

  return enriched.sort((a, b) => b.availability - a.availability);
};

const createSupervisorRequest = async ({ leaderId, supervisorId, note }) => {
  const { leader, group } = await getLeaderGroupForSupervisorRequest(leaderId);

  const supervisor = await User.findById(supervisorId);
  if (!supervisor || supervisor.role !== "teacher") {
    throw new ApiError(400, "Invalid supervisor");
  }
  if (supervisor.department !== group.department) {
    throw new ApiError(400, "Supervisor must belong to the same department");
  }

  const assignedCount = await Group.countDocuments({
    supervisor: supervisor._id,
  });
  const capacity = supervisor.supervisorCapacity || 0;
  if (assignedCount >= capacity) {
    throw new ApiError(400, "Supervisor has reached maximum capacity");
  }

  const existing = await Request.findOne({
    type: "supervisor_request",
    relatedEntity: group._id,
    status: "pending",
  });
  if (existing) {
    throw new ApiError(409, "A pending supervisor request already exists");
  }

  const request = await Request.create({
    type: "supervisor_request",
    from: leader._id,
    relatedEntity: group._id,
    relatedModel: "Group",
    metadata: {
      supervisorId: supervisor._id,
    },
    message: note || "",
  });

  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user: admin._id,
        message: `Group ${group.name} requested supervisor ${supervisor.name}`,
        type: "request",
        priority: "medium",
      }),
    ),
  );

  return await Request.findById(request._id)
    .populate("relatedEntity", "name department semester status")
    .populate("from", "name email")
    .populate("metadata.supervisorId", "name email department supervisorCapacity");
};

const getMySupervisorRequest = async (leaderId) => {
  const leader = await User.findById(leaderId);
  if (!leader || !leader.activeGroup) {
    throw new ApiError(400, "You must be in an active group");
  }

  const request = await Request.findOne({
    type: "supervisor_request",
    relatedEntity: leader.activeGroup,
  })
    .sort({ createdAt: -1 })
    .populate("relatedEntity", "name department semester status supervisor")
    .populate("from", "name email")
    .populate("metadata.supervisorId", "name email department")
    .populate("metadata.reviewedBy", "name email role");

  return request;
};

const cancelMySupervisorRequest = async ({ leaderId, requestId }) => {
  const { group } = await getLeaderGroupForSupervisorRequest(leaderId);
  const request = await Request.findById(requestId);
  if (!request || request.type !== "supervisor_request") throw new ApiError(404, "Supervisor request not found");
  if (String(request.relatedEntity) !== String(group._id)) {
    throw new ApiError(403, "You are not authorized to cancel this request");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Only pending requests can be cancelled");
  }

  request.status = "cancelled";
  request.metadata.reviewedAt = new Date();
  await request.save();

  return request;
};

const leaveGroup = async (userId) => {
  const user = await User.findById(userId);
  if (!user.activeGroup) throw new ApiError(400, "You are not in a group");

  const group = await Group.findById(user.activeGroup);
  if (!group) throw new ApiError(404, "Group not found");

  if (group.leader.equals(userId)) {
    if (group.members.length > 1) {
      throw new ApiError(400, "Please transfer leadership before leaving");
    }
    // If only leader left, delete group
    return await deleteGroup(user);
  }

  // Remove member
  group.members = group.members.filter((m) => !m.user.equals(userId));
  await group.save();

  user.activeGroup = undefined;
  await user.save();

  await notificationService.createNotification({
    user: group.leader,
    message: `${user.name} has left your group ${group.name}`,
    type: "general",
    priority: "medium",
  });

  return { message: "Left group successfully" };
};

const removeMember = async (leaderId, memberId) => {
  const leader = await User.findById(leaderId);
  if (!leader.activeGroup) throw new ApiError(400, "You are not in a group");

  const group = await Group.findById(leader.activeGroup);
  if (!group.leader.equals(leaderId)) {
    throw new ApiError(403, "Only group leader can remove members");
  }

  if (String(leaderId) === String(memberId)) {
    throw new ApiError(
      400,
      "You cannot remove yourself. Use leave group instead.",
    );
  }

  const memberIndex = group.members.findIndex(
    (m) => String(m.user) === String(memberId),
  );
  if (memberIndex === -1) throw new ApiError(404, "Member not found in group");

  group.members.splice(memberIndex, 1);
  await group.save();

  const member = await User.findById(memberId);
  member.activeGroup = undefined;
  await member.save();

  await notificationService.createNotification({
    user: memberId,
    message: `You have been removed from group ${group.name}`,
    type: "rejection",
    priority: "high",
  });

  return { message: "Member removed successfully" };
};

const transferLeadership = async (leaderId, newLeaderId) => {
  const leader = await User.findById(leaderId);
  const group = await Group.findById(leader.activeGroup);
  if (!group) throw new ApiError(404, "Group not found");

  if (!group.leader.equals(leaderId)) {
    throw new ApiError(403, "Only current leader can transfer leadership");
  }

  const isMember = group.members.some(
    (m) => String(m.user) === String(newLeaderId),
  );
  if (!isMember) throw new ApiError(400, "New leader must be a group member");

  group.leader = newLeaderId;
  await group.save();

  await notificationService.createNotification({
    user: newLeaderId,
    message: `You are now the leader of group ${group.name}`,
    type: "approval",
    priority: "high",
  });

  return group;
};

export {
  createGroup,
  inviteStudent,
  respondInvite,
  requestToJoin,
  respondJoinRequest,
  submitForApproval,
  getStudentGroup,
  getStudentGroupInvites,
  getGroupJoinRequests,
  getGroupById,
  deleteGroup,
  updateGroup,
  getAllGroups,
  getAllStudents,
  listAvailableSupervisors,
  createSupervisorRequest,
  getMySupervisorRequest,
  cancelMySupervisorRequest,
  leaveGroup,
  removeMember,
  transferLeadership,
};
