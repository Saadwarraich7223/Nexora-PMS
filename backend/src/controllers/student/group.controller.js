import asyncHandler from "../../utils/asyncHandler.js";
import * as groupService from "../../services/student/group.service.js";
import * as githubService from "../../services/student/github.service.js";
import ApiError from "../../utils/apiError.js";

// student can create a group (only if he is not already in a group)
const createGroup = asyncHandler(async (req, res) => {
  const createrId = req.user._id;

  if (!createrId) throw new ApiError(404, "Unauthorized");
  const { name, semester, department } = req.body;
  const group = await groupService.createGroup({
    createrId,
    name,
    semester,
    department,
  });
  res.json({ message: "Group created successfully", group });
});

//group leader can send invite request to other students to join their gorup
const inviteOtherStudentToGroup = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const groupId = req.user.activeGroup;
  if (!senderId) throw new ApiError(404, "Unauthorized");
  const { receiverId } = req.body;

  if (!receiverId) throw new ApiError(400, "Receiver id is required");

  const invite = await groupService.inviteStudent({
    senderId,
    groupId,
    receiverId,
  });

  res.json({ message: "Invite sent successfully", invite });
});

// the students can respond to the group invites
const respondToInviteFromAGroup = asyncHandler(async (req, res) => {
  const receiverId = req.user._id;
  const inviteId = req.params.inviteId;
  const { accept } = req.body;
  if (!receiverId) throw new ApiError(404, "Unauthorized");
  const invite = await groupService.respondInvite({
    receiverId,
    inviteId,
    accept,
  });

  res.json({ message: "Responded to invite successfully", invite });
});

//a student can send request to join the group
const requestToJoinGroup = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { groupId } = req.body;
  const request = await groupService.requestToJoin({ groupId, senderId });
  res.json({ message: "Request sent successfully", request });
});

// respond to the request from other student to join the group (leader response to the request)
const respondToJoinRequest = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  const requestId = req.params.requestId;
  const { accept } = req.body;
  const response = await groupService.respondJoinRequest({
    leaderId,
    requestId,
    accept,
  });
  res.json({ message: "Responded to request successfully", response });
});

//submit group for approval to admin
const submitGroupForApproval = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  const groupId = req.user.activeGroup;
  const response = await groupService.submitForApproval({
    leaderId,
    groupId,
  });
  res.json({ message: "Group submitted for approval successfully", response });
});

// other student can get the group by groupId
const getAGroup = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.groupId);
  res.json({ message: "Group fetched successfully", group });
});

// student can get his/her group
const getMyGroup = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(404, "Unauthorized");
  const group = await groupService.getStudentGroup(user);
  res.json({ message: "Group fetched successfully", group });
});

// students can get the list of group join invites
const getInvites = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) throw new ApiError(404, "Unauthorized");

  const invites = await groupService.getStudentGroupInvites(userId);
  res.json({ message: "Invites fetched successfully", invites });
});

// leader can get the list of group join requests
const getJoinRequests = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  if (!leaderId) throw new ApiError(404, "Unauthorized");

  const requests = await groupService.getGroupJoinRequests(leaderId);
  res.json({ message: "Join requests fetched successfully", requests });
});

// leader can delete the group (only if the group is not active)
const deletGroupByLeader = asyncHandler(async (req, res) => {
  const leader = req.user;
  const response = await groupService.deleteGroup(leader);
  return res.json({ message: "Group deleted successfully", response });
});

// leader can update the group
const updateGroupByLeader = asyncHandler(async (req, res) => {
  const user = req.user;
  const payload = req.body;
  const updatedGroup = await groupService.updateGroup({ user, payload });

  return res.json({ message: "Group updated successfully", updatedGroup });
});

// get all groups related to the user
const getUserRelatedGroups = asyncHandler(async (req, res) => {
  const user = req.user;
  const groups = await groupService.getAllGroups({ user });

  return res.json({ message: "Groups fetched successfully", groups });
});

// get all students related to the user
const getUserRelatedStudents = asyncHandler(async (req, res) => {
  const user = req.user;
  const students = await groupService.getAllStudents({ user });

  return res.json({ message: "Students fetched successfully", students });
});

// member can leave the group
const leaveGroup = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const response = await groupService.leaveGroup(userId);
  return res.json({ message: "Left group successfully", response });
});

// leader can remove a member from the group
const removeMember = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  const { userId: memberId } = req.params;
  const response = await groupService.removeMember(leaderId, memberId);
  return res.json({ message: "Member removed successfully", response });
});

// leader can transfer leadership to another member
const transferLeadership = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  const { newLeaderId } = req.body;
  const updatedGroup = await groupService.transferLeadership(leaderId, newLeaderId);
  return res.json({ message: "Leadership transferred successfully", updatedGroup });
});

const getAvailableSupervisors = asyncHandler(async (req, res) => {
  const supervisors = await groupService.listAvailableSupervisors(req.user._id);
  return res.json({ message: "Available supervisors fetched successfully", supervisors });
});

const createSupervisorRequest = asyncHandler(async (req, res) => {
  const request = await groupService.createSupervisorRequest({
    leaderId: req.user._id,
    supervisorId: req.body.supervisorId,
    note: req.body.note,
  });
  return res.status(201).json({
    message: "Supervisor request submitted successfully",
    request,
  });
});

const getMySupervisorRequest = asyncHandler(async (req, res) => {
  const request = await groupService.getMySupervisorRequest(req.user._id);
  return res.json({ message: "Supervisor request fetched successfully", request });
});

const cancelMySupervisorRequest = asyncHandler(async (req, res) => {
  const request = await groupService.cancelMySupervisorRequest({
    leaderId: req.user._id,
    requestId: req.params.requestId,
  });
  return res.json({ message: "Supervisor request cancelled successfully", request });
});

const linkGithubRepo = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You don't have an active group");
  
  const { repoUrl } = req.body;
  const group = await githubService.linkGithubRepo(groupId, leaderId, repoUrl);
  return res.json({ message: "GitHub repository linked successfully", github: group.github });
});

const syncGithubCommits = asyncHandler(async (req, res) => {
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You don't have an active group");
  
  const githubData = await githubService.syncAllGithubData(groupId);
  return res.json({ message: "GitHub data synced successfully", github: githubData });
});

const unlinkGithubRepo = asyncHandler(async (req, res) => {
  const leaderId = req.user._id;
  const groupId = req.user.activeGroup;
  if (!groupId) throw new ApiError(400, "You don't have an active group");
  
  const group = await githubService.unlinkGithubRepo(groupId, leaderId);
  return res.json({ message: "GitHub repository unlinked successfully", github: group.github });
});

export {
  createGroup,
  inviteOtherStudentToGroup,
  respondToInviteFromAGroup,
  requestToJoinGroup,
  respondToJoinRequest,
  submitGroupForApproval,
  getAGroup,
  getMyGroup,
  getInvites,
  getJoinRequests,
  deletGroupByLeader,
  updateGroupByLeader,
  getUserRelatedGroups,
  getUserRelatedStudents,
  leaveGroup,
  removeMember,
  transferLeadership,
  getAvailableSupervisors,
  createSupervisorRequest,
  getMySupervisorRequest,
  cancelMySupervisorRequest,
  linkGithubRepo,
  syncGithubCommits,
  unlinkGithubRepo,
};
