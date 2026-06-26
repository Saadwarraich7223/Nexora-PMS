import RubricCriteria from "../../models/rubricCriteria.model.js";
import Task from "../../models/task.model.js";
import File from "../../models/file.model.js";
import Group from "../../models/group.model.js";
import Feature from "../../models/feature.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";

/**
 * Get Rubric Alignment Report for a specific group
 * Calculates coverage of technical artifacts across all active rubric criteria
 */
export const getRubricAlignmentReport = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId).lean();
  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  // 1. Fetch all active rubric criteria for the group's department/scope
  const activeCriteria = await RubricCriteria.find({
    $or: [
      { "scope.department": group.department },
      { "scope.department": null }
    ],
    isActive: true
  }).lean();

  // 2. Fetch all tasks, files, and features for this group
  const [tasks, files, features] = await Promise.all([
    Task.find({ group: groupId }).lean(),
    File.find({ relatedEntity: groupId, relatedModel: "Group" }).lean(),
    Feature.find({ group: groupId }).lean()
  ]);

  const completedTasks = tasks.filter(t => t.status === "completed" || t.status === "review");
  const completedFeatures = features.filter(f => f.status === "completed" || f.status === "in_progress");

  // 3. Map artifacts to criteria
  const report = activeCriteria.map(criteria => {
    // Standard manual linked artifacts
    const linkedTasks = tasks.filter(t => String(t.rubricCriteria) === String(criteria._id));
    const linkedFiles = files.filter(f => String(f.rubricCriteria) === String(criteria._id));
    
    let isSatisfied = (linkedTasks.length + linkedFiles.length) > 0;
    const artifactList = [
      ...linkedTasks.map(t => ({ id: t._id, title: t.title, type: "task" })),
      ...linkedFiles.map(f => ({ id: f._id, title: f.metadata?.originalName || "Unnamed File", type: "file" }))
    ];

    // Automated Inference based on keywords/semantics
    const labelLower = criteria.label.toLowerCase();
    const keyLower = criteria.key ? criteria.key.toLowerCase() : "";

    // A. Feature Completion
    if (labelLower.includes("feature") || keyLower.includes("feature")) {
      if (completedFeatures.length > 0) {
        isSatisfied = true;
        completedFeatures.forEach(f => {
          artifactList.push({ id: f._id, title: f.name, type: "task" });
        });
      }
    }

    // B. Task Velocity & Execution
    if (labelLower.includes("task") || labelLower.includes("velocity") || keyLower.includes("task")) {
      if (completedTasks.length > 0) {
        isSatisfied = true;
        // Don't flood artifactList with all tasks, just top 2
        completedTasks.slice(0, 2).forEach(t => {
          artifactList.push({ id: t._id, title: t.title, type: "task" });
        });
      }
    }

    // C. Code Repository (GitHub)
    if (labelLower.includes("repository") || labelLower.includes("code") || keyLower.includes("repo")) {
      if (group.githubRepo) {
        isSatisfied = true;
        artifactList.push({ id: "github", title: group.githubRepo, type: "file" }); // File text icon works for repo link
      }
    }

    return {
      criteriaId: criteria._id,
      label: criteria.label,
      key: criteria.key,
      description: criteria.description,
      isRequired: criteria.isRequired,
      coverage: {
        taskCount: linkedTasks.length + (labelLower.includes("feature") ? completedFeatures.length : 0),
        fileCount: linkedFiles.length + (labelLower.includes("repository") && group.githubRepo ? 1 : 0),
        isSatisfied,
        artifactList
      }
    };
  });

  // 4. Calculate overall completion percentage
  const satisfiedCount = report.filter(r => r.coverage.isSatisfied).length;
  const completionPercentage = activeCriteria.length > 0 
    ? Math.round((satisfiedCount / activeCriteria.length) * 100) 
    : 0;

  res.status(200).json({
    success: true,
    data: {
      groupId,
      groupName: group.name,
      completionPercentage,
      totalCriteria: activeCriteria.length,
      satisfiedCriteria: satisfiedCount,
      report
    }
  });
});

/**
 * List all active Rubric Criteria
 */
export const listActiveCriteria = asyncHandler(async (req, res) => {
  const criteria = await RubricCriteria.find({ isActive: true }).lean();
  res.status(200).json({
    success: true,
    data: criteria
  });
});
