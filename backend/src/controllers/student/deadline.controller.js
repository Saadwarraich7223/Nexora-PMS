import asyncHandler from "../../utils/asyncHandler.js";
import Deadline from "../../models/deadline.model.js";
import Project from "../../models/project.model.js";
import ApiError from "../../utils/apiError.js";

const getDeadlines = asyncHandler(async (req, res) => {
  if (!req.user.activeGroup) {
    throw new ApiError(400, "You are not in an active group");
  }

  const project = await Project.findOne({ group: req.user.activeGroup });
  if (!project) {
    return res.json({
      message: "No project found for your group",
      count: 0,
      deadlines: [],
    });
  }

  const deadlines = await Deadline.find({ project: project._id })
    .populate("createdBy", "name email")
    .populate("linkedFeature", "name status completedAt")
    .populate("overriddenBy", "name")
    .sort({ dueDate: 1 })
    .lean();

  res.json({
    message: "Deadlines fetched successfully",
    count: deadlines.length,
    deadlines,
  });
});

export { getDeadlines };
