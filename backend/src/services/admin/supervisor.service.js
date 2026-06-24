import Group from "../../models/group.model.js";
import User from "../../models/user.model.js";
import ApiError from "../../utils/apiError.js";
import * as notificationService from "../notification.service.js";

import Project from "../../models/project.model.js";

export const recommendSupervisors = async (department, groupId) => {
  const supervisors = await User.find({ role: "teacher", department }).lean();

  let projectStr = "";
  if (groupId) {
    const project = await Project.findOne({ group: groupId }).lean();
    if (project) {
      projectStr = `${project.title || ""} ${project.description || ""} ${project.keywords ? project.keywords.join(" ") : ""}`.toLowerCase();
    }
  }

  const supervisorIds = supervisors.map((s) => s._id);

  const groupCounts = await Group.aggregate([
    { $match: { supervisor: { $in: supervisorIds } } },
    { $group: { _id: "$supervisor", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(groupCounts.map((g) => [String(g._id), g.count]));

  const ranked = supervisors
    .map((s) => {
      const assigned = countMap.get(String(s._id)) || 0;
      const capacity = s.supervisorCapacity || 0;
      const availability = Math.max(capacity - assigned, 0);

      // Keyword matching
      let matchScore = 0;
      if (projectStr && s.expertise && s.expertise.length > 0) {
        s.expertise.forEach((term) => {
          if (projectStr.includes(term.toLowerCase())) {
            matchScore += 1;
          }
        });
      }

      return { ...s, assignedCount: assigned, availability, matchScore };
    })
    .sort((a, b) => {
      // Primary: Availability. Secondary: Match score.
      if (b.availability !== a.availability) {
        return b.availability - a.availability;
      }
      return b.matchScore - a.matchScore;
    });
  return ranked.map((s) => ({
    supervisorId: s._id,
    name: s.name,
    email: s.email,
    availability: s.availability,
    capacity: s.supervisorCapacity,
    assignedCount: s.assignedCount,
    matchScore: s.matchScore,
  }));
};

export const assignSupervisorToGroup = async ({ groupId, supervisorId }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (group.supervisor) {
    throw new ApiError(400, "Group already has a supervisor");
  }

  const supervisor = await User.findById(supervisorId);
  if (!supervisor || supervisor.role !== "teacher") {
    throw new ApiError(400, "Invalid supervisor");
  }
  const assignedCount = supervisor.assignedGroups?.length || 0;
  if (supervisor.supervisorCapacity <= assignedCount) {
    throw new ApiError(400, "Supervisor has reached maximum capacity");
  }

  group.supervisor = supervisor._id;
  await group.save();
  if (!supervisor.assignedGroups) supervisor.assignedGroups = [];
  const exists = supervisor.assignedGroups.some(
    (id) => String(id) === String(group._id),
  );
  if (!exists) supervisor.assignedGroups.push(group._id);
  await supervisor.save();

  await notificationService.createNotification({
    user: group.leader,
    message: `Supervisor ${supervisor.name} has been assigned to your group ${group.name}`,
    type: "approval",
    priority: "high",
  });

  await notificationService.createNotification({
    user: supervisorId,
    message: `You have been assigned as supervisor for group ${group.name}`,
    type: "approval",
    priority: "high",
  });

  return group;
};

export const listSupervisors = async () => {
  const supervisors = await User.find({ role: "teacher" }).select("-password");
  return supervisors;
};

export const getSupervisorWorkload = async (supervisorId) => {
  const supervisor = await User.findById(supervisorId).select("-password");
  if (!supervisor || supervisor.role !== "teacher") {
    throw new ApiError(404, "Supervisor not found");
  }

  const groupCount = await Group.countDocuments({ supervisor: supervisorId });
  const capacity = supervisor.supervisorCapacity || 0;

  return {
    supervisorId: supervisor._id,
    name: supervisor.name,
    email: supervisor.email,
    groupCount,
    assignedCount: groupCount,
    capacity,
    availability: Math.max(capacity - groupCount, 0),
  };
};
