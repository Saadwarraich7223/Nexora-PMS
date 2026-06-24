import File from "../../models/file.model.js";
import Group from "../../models/group.model.js";
import Task from "../../models/task.model.js";
import ApiError from "../../utils/apiError.js";

const ensureMember = (group, userId) =>
  group.members.some((m) => String(m.user) === String(userId));

const ensureTaskLinkPermission = ({ group, task, userId }) => {
  const isLeader = String(group.leader) === String(userId);
  const isTaskOwner = task.assignedTo && String(task.assignedTo) === String(userId);

  if (!isLeader && !isTaskOwner) {
    throw new ApiError(
      403,
      "You can only link resources to your assigned tasks unless you are the group leader",
    );
  }
};

const uploadResource = async ({
  groupId,
  userId,
  fileUrl,
  description,
  originalName,
  linkedTaskIds = [],
}) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const isMember = ensureMember(group, userId);
  if (!isMember) {
    throw new ApiError(403, "You are not a member of this group");
  }

  const normalizedTaskIds = [...new Set((linkedTaskIds || []).map(String))];

  let tasks = [];
  if (normalizedTaskIds.length > 0) {
    tasks = await Task.find({
      _id: { $in: normalizedTaskIds },
      group: groupId,
    });

    if (tasks.length !== normalizedTaskIds.length) {
      throw new ApiError(
        400,
        "One or more linked tasks are invalid for this group",
      );
    }

    tasks.forEach((task) => ensureTaskLinkPermission({ group, task, userId }));
  }

  let finalName = originalName || "Unnamed File";
  let counter = 0;
  let searchName = finalName;

  const lastDotIndex = finalName.lastIndexOf(".");
  let baseName = finalName;
  let ext = "";
  if (lastDotIndex > 0) {
    baseName = finalName.substring(0, lastDotIndex);
    ext = finalName.substring(lastDotIndex);
  }

  // Keep checking until we find a unique name in this group
  while (await File.exists({
    category: "group_resource",
    relatedEntity: groupId,
    "metadata.originalName": searchName
  })) {
    counter += 1;
    searchName = `${baseName} (${counter})${ext}`;
  }
  finalName = searchName;

  const resource = await File.create({
    category: "group_resource",
    relatedEntity: groupId,
    relatedModel: "Group",
    uploadedBy: userId,
    fileUrl,
    metadata: {
      originalName: finalName,
      description,
      linkedTasks: normalizedTaskIds,
    },
  });

  if (normalizedTaskIds.length > 0) {
    await Task.updateMany(
      { _id: { $in: normalizedTaskIds }, group: groupId },
      { $addToSet: { linkedResources: resource._id } },
    );
  }

  return resource;
};

const getGroupResources = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  const isMember = ensureMember(group, userId);
  if (!isMember) {
    throw new ApiError(403, "You are not a member of this group");
  }

  const files = await File.find({
    category: "group_resource",
    relatedEntity: groupId,
  })
    .populate("uploadedBy", "name email")
    .populate("metadata.linkedTasks", "title status assignedTo")
    .lean();

  return files;
};

const deleteResource = async (resourceId, userId) => {
  const resource = await File.findById(resourceId);
  if (!resource || resource.category !== "group_resource") {
    throw new ApiError(404, "Resource not found");
  }

  const group = await Group.findById(resource.relatedEntity);
  if (!group) throw new ApiError(404, "Associated group not found");

  const isUploader = String(resource.uploadedBy) === String(userId);
  const isLeader = String(group.leader) === String(userId);

  if (!isUploader && !isLeader) {
    throw new ApiError(
      403,
      "Only the uploader or group leader can delete this resource",
    );
  }

  await Task.updateMany(
    { linkedResources: resource._id },
    { $pull: { linkedResources: resource._id } },
  );

  await resource.deleteOne();
  return { deleted: true };
};

export { uploadResource, getGroupResources, deleteResource };
