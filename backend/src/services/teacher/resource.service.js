import File from "../../models/file.model.js";
import Group from "../../models/group.model.js";
import ApiError from "../../utils/apiError.js";

const getGroupFilesAsSupervisor = async (groupId, supervisorId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");
  if (String(group.supervisor) !== String(supervisorId)) {
    throw new ApiError(403, "You are not the supervisor of this group");
  }

  const files = await File.find({
    category: "group_resource",
    relatedEntity: groupId,
  }).populate("uploadedBy", "name email role");

  return files;
};

const getResourceFileAsSupervisor = async (fileId, supervisorId) => {
  const file = await File.findById(fileId);
  if (!file || file.category !== "group_resource") {
    throw new ApiError(404, "Resource not found");
  }

  const group = await Group.findById(file.relatedEntity);
  if (!group || String(group.supervisor) !== String(supervisorId)) {
    throw new ApiError(403, "You are not the supervisor of this group");
  }

  return file;
};

export { getGroupFilesAsSupervisor, getResourceFileAsSupervisor };
