import Project from "../models/project.model.js";
import RubricCriteria from "../models/rubricCriteria.model.js";
import Feature from "../models/feature.model.js";
import Task from "../models/task.model.js";
import ApiError from "../utils/apiError.js";

/**
 * Evidence Service handles the validation of grading evidence
 * against defined RubricCriteria.
 */

const getAutomatedMetric = async (project, key) => {
  switch (key) {
    case "featureCompletion": {
      const features = await Feature.find({ group: project.group });
      const total = features.length;
      const completed = features.filter((f) => f.status === "completed" || f.isCompleted).length;
      return total > 0 ? (completed / total) * 100 : 0;
    }
    case "taskCompletion": {
      const tasks = await Task.find({ group: project.group });
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "done" || t.status === "completed").length;
      return total > 0 ? (completed / total) * 100 : 0;
    }
    case "proposalQuality": {
      return project.analysis?.score || 0;
    }
    default:
      return 0;
  }
};

const checkCriterionCompleteness = async (projectId, criterionKey) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");

  const criterion = await RubricCriteria.findOne({ key: criterionKey });
  if (!criterion) throw new ApiError(404, `Criterion ${criterionKey} not found`);

  // 1. Check if it's in the registry
  const evidence = project.evidenceRegistry.find((e) => e.criterionKey === criterionKey);

  // 2. Handle Types
  if (criterion.evidenceType === "automated") {
    const score = await getAutomatedMetric(project, criterionKey);
    return {
      satisfied: score >= 50, // Arbitrary threshold for "satisfied", but usually automated is a score
      score,
      status: "automated",
      message: `System calculated score: ${score.toFixed(1)}%`,
    };
  }

  if (criterion.evidenceType === "file" || criterion.evidenceType === "link") {
    if (!evidence) {
      return {
        satisfied: false,
        status: "missing",
        message: `Required ${criterion.evidenceType} evidence is missing.`,
      };
    }

    const isApproved = evidence.validationStatus === "approved";
    return {
      satisfied: isApproved,
      status: evidence.validationStatus,
      value: evidence.value,
      message: isApproved 
        ? "Evidence validated by supervisor." 
        : `Evidence is ${evidence.validationStatus}.`,
    };
  }

  return { satisfied: false, status: "unknown", message: "Unknown evidence type" };
};

const getProjectQualityReport = async (projectId) => {
  const project = await Project.findById(projectId);
  const allCriteria = await RubricCriteria.find({ isActive: true });

  const report = await Promise.all(
    allCriteria.map(async (c) => {
      const status = await checkCriterionCompleteness(projectId, c.key);
      return {
        key: c.key,
        label: c.label,
        isRequired: c.isRequired,
        ...status,
      };
    }),
  );

  const mandatorySatisfied = report
    .filter((r) => r.isRequired)
    .every((r) => r.satisfied);

  const totalScore = report.reduce((sum, r) => sum + (r.score || (r.satisfied ? 100 : 0)), 0) / report.length;

  return {
    projectId,
    overallQualityScore: totalScore,
    mandatorySatisfied,
    criteria: report,
    generatedAt: new Date(),
  };
};

export default {
  checkCriterionCompleteness,
  getProjectQualityReport,
};
