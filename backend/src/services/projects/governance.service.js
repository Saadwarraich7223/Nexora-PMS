import Project from "../../models/project.model.js";
import Milestone from "../../models/milestone.model.js";

/**
 * Automatically evaluates and updates milestone statuses based on evidence registry.
 * This logic is shared between student (submission) and teacher (validation) modules.
 */
export const syncMilestoneStatus = async (projectId) => {
  const [milestones, project] = await Promise.all([
    Milestone.find({ project: projectId }),
    Project.findById(projectId)
  ]);

  if (!project) return;

  const evidenceRegistry = project.evidenceRegistry || [];
  const providedKeys = evidenceRegistry.map(e => e.criterionKey);
  const approvedKeys = evidenceRegistry
    .filter(e => e.validationStatus === "approved")
    .map(e => e.criterionKey);

  for (const milestone of milestones) {
    const requiredKeys = milestone.criteriaKeys || [];
    if (requiredKeys.length === 0) continue;

    const isFullyApproved = requiredKeys.every(key => approvedKeys.includes(key));
    const isFullyProvided = requiredKeys.every(key => providedKeys.includes(key));
    
    const currentStatus = milestone.status;

    if (isFullyApproved) {
      if (currentStatus !== "completed") {
        milestone.status = "completed";
        milestone.completedAt = new Date();
        await milestone.save();
      }
    } else if (isFullyProvided) {
      if (currentStatus !== "submitted" && currentStatus !== "completed") {
        milestone.status = "submitted";
        await milestone.save();
      }
    } else {
      if (currentStatus === "submitted" || currentStatus === "completed") {
        milestone.status = "pending";
        milestone.completedAt = null;
        await milestone.save();
      }
    }
  }
};
