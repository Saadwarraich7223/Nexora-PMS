import Project from "../../models/project.model.js";
import Group from "../../models/group.model.js";
import Task from "../../models/task.model.js";
import Feature from "../../models/feature.model.js";
import Deadline from "../../models/deadline.model.js";
import MeetingLog from "../../models/meetingLog.model.js";
import File from "../../models/file.model.js";
import Evaluation from "../../models/evaluation.model.js";
import CompletionAudit from "../../models/completionAudit.model.js";
import CompletionPolicy from "../../models/completionPolicy.model.js";
import User from "../../models/user.model.js";
import GRADING_CONFIG from "../../config/gradingConfig.js";
import GradingTemplate from "../../models/gradingTemplate.model.js";
import EvidenceService from "../evidence.service.js";
import ApiError from "../../utils/apiError.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const verifyProjectSupervisor = async (projectId, teacherId) => {
  const project = await Project.findById(projectId).populate("group");
  if (!project) throw new ApiError(404, "Project not found");
  if (!project.group) throw new ApiError(404, "Group not found for project");
  if (!project.group.supervisor || !project.group.supervisor.equals(teacherId)) {
    throw new ApiError(403, "You are not the supervisor of this project");
  }
  return { project, group: project.group };
};

const logEvaluationActivity = async (evaluation, { type, actorId, note = "", status = null, metadata = {} }) => {
  evaluation.activities.push({
    type,
    status: status || evaluation.status,
    actor: actorId,
    timestamp: new Date(),
    note,
    metadata,
  });
};

const getDefaultPolicy = () => ({
  source: "default",
  name: "Default Completion Policy",
  version: "grading-config-v1",
  requirePublishedEvaluation: true,
  completionCriteria: {
    minTaskCompletionPercent: GRADING_CONFIG.completionCriteria.minTaskCompletionPercent,
    allFeaturesCompleted: GRADING_CONFIG.completionCriteria.allFeaturesCompleted,
    allDeadlinesResolved: GRADING_CONFIG.completionCriteria.allDeadlinesResolved,
    minFilesUploaded: GRADING_CONFIG.completionCriteria.minFilesUploaded,
    minMeetingsHeld: 0,
  },
});

const getCompletionPolicyForGroup = async (group) => {
  const department = group?.department || null;
  const semester = Number.isFinite(Number(group?.semester))
    ? Number(group.semester)
    : null;

  if (department && semester !== null) {
    const exact = await CompletionPolicy.findOne({
      isActive: true,
      "scope.department": department,
      "scope.semester": semester,
    })
      .sort({ updatedAt: -1 })
      .lean();
    if (exact) return { source: "db", ...exact };
  }

  if (department) {
    const deptOnly = await CompletionPolicy.findOne({
      isActive: true,
      "scope.department": department,
      "scope.semester": null,
    })
      .sort({ updatedAt: -1 })
      .lean();
    if (deptOnly) return { source: "db", ...deptOnly };
  }

  const globalPolicy = await CompletionPolicy.findOne({
    isActive: true,
    "scope.department": null,
    "scope.semester": null,
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (globalPolicy) return { source: "db", ...globalPolicy };
  return getDefaultPolicy();
};

// ─── 1. Completion Metrics ────────────────────────────────────────────────────

const calculateCompletionMetrics = async (projectId, teacherId, options = {}) => {
  const { project, group } = await verifyProjectSupervisor(projectId, teacherId);

  const [features, tasks, deadlines, files, meetings] = await Promise.all([
    Feature.find({ group: group._id }).lean(),
    Task.find({ group: group._id }).lean(),
    Deadline.find({ project: projectId }).lean(),
    File.find({ category: "group_resource", relatedEntity: group._id }).lean(),
    MeetingLog.find({ group: group._id }).lean(),
  ]);

  const now = new Date();

  const metrics = {
    featuresTotal: features.length,
    featuresCompleted: features.filter((f) => f.status === "completed").length,
    tasksTotal: tasks.length,
    tasksCompleted: tasks.filter((t) => t.status === "completed").length,
    deadlinesTotal: deadlines.length,
    deadlinesOnTime: deadlines.filter((d) =>
      d.completionStatus === "completed_early" || d.completionStatus === "completed_on_time"
    ).length,
    deadlinesOverdue: deadlines.filter((d) =>
      d.completionStatus === "overdue" || (d.dueDate && new Date(d.dueDate) < now && d.completionStatus === "pending")
    ).length,
    filesUploaded: files.length,
    meetingsHeld: meetings.length,
    lastCalculatedAt: now,
  };

  // Cache it on the project
  project.completionMetrics = metrics;
  await project.save();

  // Check completion criteria
  const criteria = options.completionCriteria || GRADING_CONFIG.completionCriteria;
  const taskPercent = metrics.tasksTotal > 0
    ? (metrics.tasksCompleted / metrics.tasksTotal) * 100
    : 0;

  const pendingDeadlinesPastDue = deadlines.filter(
    (d) => d.completionStatus === "pending" && d.dueDate && new Date(d.dueDate) < now
  ).length;

  const checks = {
    allFeaturesCompleted:
      criteria.allFeaturesCompleted === false
        ? true
        : (metrics.featuresTotal === 0 || metrics.featuresCompleted === metrics.featuresTotal),
    taskCompletionMet: taskPercent >= criteria.minTaskCompletionPercent,
    allDeadlinesResolved:
      criteria.allDeadlinesResolved === false
        ? true
        : pendingDeadlinesPastDue === 0,
    filesUploaded: metrics.filesUploaded >= criteria.minFilesUploaded,
    meetingsHeld: metrics.meetingsHeld >= (criteria.minMeetingsHeld || 0),
  };

  const isReadyForCompletion = Object.values(checks).every(Boolean);

  return { metrics, checks, isReadyForCompletion, taskPercent };
};

const buildReadinessChecks = ({ project, metricsResult, hasPublishedEvaluation, requirePublishedEvaluation, policy }) => {
  const checks = [
    {
      key: "projectStatusAllowed",
      passed: ["approved", "in_progress"].includes(project.status),
      expected: "approved|in_progress",
      actual: project.status,
      message: "Project must be approved or in_progress before completion.",
    },
    {
      key: "completionCriteriaSatisfied",
      passed: metricsResult.isReadyForCompletion,
      expected: true,
      actual: metricsResult.checks,
      message: "Base completion criteria (features/tasks/deadlines/files) must be satisfied.",
    },
    {
      key: "evaluationPublished",
      passed: requirePublishedEvaluation ? hasPublishedEvaluation : true,
      expected: requirePublishedEvaluation ? true : "not_required",
      actual: hasPublishedEvaluation,
      message: "Published final evaluation is required before project completion.",
    },
    {
      key: "policyResolved",
      passed: Boolean(policy?.version),
      expected: "policy_version_present",
      actual: policy?.version || null,
      message: "A completion policy version must be resolved for this group.",
    },
    {
      key: "mandatoryEvidenceSatisfied",
      passed: metricsResult.qualityReport?.mandatorySatisfied ?? true,
      expected: true,
      actual: metricsResult.qualityReport?.mandatorySatisfied,
      message: "All mandatory evidence (docs, links, repo) must be provided and approved.",
    },
  ];

  return checks;
};

const calculateReadinessScore = (checks) => {
  if (!checks.length) return 0;
  const passed = checks.filter((c) => c.passed).length;
  return Math.round((passed / checks.length) * 100);
};

const createCompletionAudit = async ({
  projectId,
  groupId,
  actorId,
  decision,
  reason,
  checks,
  readinessScore,
}) => {
  await CompletionAudit.create({
    project: projectId,
    group: groupId,
    actor: actorId,
    decision,
    reason,
    checks,
    readinessScore,
  });
};

const evaluateCompletionReadiness = async (
  projectId,
  teacherId,
  { requirePublishedEvaluation = null } = {},
) => {
  const { project, group } = await verifyProjectSupervisor(projectId, teacherId);
  const policy = await getCompletionPolicyForGroup(group);
  const effectiveRequirePublishedEvaluation =
    typeof requirePublishedEvaluation === "boolean"
      ? requirePublishedEvaluation
      : Boolean(policy.requirePublishedEvaluation);

  const [metricsResult, qualityReport] = await Promise.all([
    calculateCompletionMetrics(projectId, teacherId, {
      completionCriteria: policy.completionCriteria,
    }),
    EvidenceService.getProjectQualityReport(projectId),
  ]);

  // Inject quality report into metricsResult for buildReadinessChecks
  metricsResult.qualityReport = qualityReport;

  const publishedEvaluation = await Evaluation.findOne({
    project: projectId,
    status: "published",
  })
    .select("_id status publishedAt")
    .lean();

  const checks = buildReadinessChecks({
    project,
    metricsResult,
    hasPublishedEvaluation: Boolean(publishedEvaluation),
    requirePublishedEvaluation: effectiveRequirePublishedEvaluation,
    policy,
  });

  const readinessScore = calculateReadinessScore(checks);
  const failedChecks = checks.filter((c) => !c.passed);
  const decision = failedChecks.length === 0 ? "allow" : "deny";

  return {
    project,
    group,
    metrics: metricsResult.metrics,
    criteriaChecks: metricsResult.checks,
    taskPercent: metricsResult.taskPercent,
    policy,
    requirePublishedEvaluation: effectiveRequirePublishedEvaluation,
    hasPublishedEvaluation: Boolean(publishedEvaluation),
    evaluation: publishedEvaluation || null,
    checks,
    failedChecks,
    readinessScore,
    decision,
  };
};

const getPublishEligibilityChecks = ({ project, metricsResult }) => {
  const checks = [
    {
      key: "projectStatusAllowedForPublish",
      passed: ["approved", "in_progress", "completed"].includes(project.status),
      expected: "approved|in_progress|completed",
      actual: project.status,
      message: "Project must be approved or in progress before publishing evaluation.",
    },
    {
      key: "completionCriteriaSatisfied",
      passed: metricsResult.isReadyForCompletion,
      expected: true,
      actual: metricsResult.checks,
      message: "Base completion criteria must be satisfied before publishing evaluation.",
    },
  ];

  return checks;
};

// ─── 2. Suggested Grades ──────────────────────────────────────────────────────

const calculateSuggestedGrades = async (projectId, teacherId) => {
  const { project, group } = await verifyProjectSupervisor(projectId, teacherId);

  const populatedGroup = await Group.findById(group._id)
    .populate("members.user", "name email")
    .lean();

  const [features, tasks, deadlines, meetings, projectData] = await Promise.all([
    Feature.find({ group: group._id }).lean(),
    Task.find({ group: group._id }).lean(),
    Deadline.find({ project: projectId }).lean(),
    MeetingLog.find({ group: group._id }).populate("attendees", "_id").lean(),
    Project.findById(projectId).select("gradingTemplate").lean(),
  ]);

  // Fetch Grading Template or Use Default
  let template = null;
  if (projectData?.gradingTemplate) {
    template = await GradingTemplate.findById(projectData.gradingTemplate).lean();
  }

  if (!template) {
    template = await GradingTemplate.findOne({ isDefault: true }).lean();
  }

  // If no template in DB, fallback to hardcoded config (backward compatibility)
  const weights = template?.weights || GRADING_CONFIG.groupWeights;
  const mWeights = template?.memberWeights || GRADING_CONFIG.memberWeights;
  const expectations = template?.expectations || GRADING_CONFIG.expectations;

  // ── Component 1: Deadline Performance ───────────────────────────────────
  let deadlineScore = 0;
  const gradedDeadlines = deadlines.filter((d) => d.grade !== null && d.maxGrade > 0);
  if (gradedDeadlines.length > 0) {
    const avgDeadlinePercent = gradedDeadlines.reduce((sum, d) => sum + (d.grade / d.maxGrade) * 100, 0) / gradedDeadlines.length;
    deadlineScore = avgDeadlinePercent;
  } else {
    // Fallback: use completion status ratios
    const resolved = deadlines.filter((d) => d.completionStatus !== "pending").length;
    const onTime = deadlines.filter((d) =>
      d.completionStatus === "completed_early" || d.completionStatus === "completed_on_time"
    ).length;
    deadlineScore = resolved > 0 ? (onTime / resolved) * 100 : 100;
  }

  // ── Component 2: Feature Completion (25%) ───────────────────────────────
  const featureScore = features.length > 0
    ? (features.filter((f) => f.status === "completed").length / features.length) * 100
    : 100;

  // ── Component 3: Task Completion (15%) ──────────────────────────────────
  const taskScore = tasks.length > 0
    ? (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100
    : 100;

  // ── Component 4: Meeting Engagement (10%) ───────────────────────────────
  const projectAge = Math.max(1, Math.ceil(
    (Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));
  const expectedMeetings = projectAge * expectations.meetingsPerMonth;
  const meetingScore = Math.min((meetings.length / expectedMeetings) * 100, 100);

  // ── Component 5: Code Contribution (10%) ────────────────────────────────
  let codeScore = 0;
  if (populatedGroup.github && populatedGroup.github.weeklyActivity) {
    const totalWeeks = Math.max(projectAge * 4, 1);
    const activeWeeks = populatedGroup.github.weeklyActivity.filter((w) => w.count > 0).length;
    codeScore = Math.min((activeWeeks / totalWeeks) * 100, 100);
  } else if (populatedGroup.github && populatedGroup.github.totalCommits > 0) {
    codeScore = 75; // has commits but no weekly tracking — generous default
  }

  // ── Component 6: Proposal Quality (10%) ─────────────────────────────────
  const proposalScore = project.analysis?.score || 0;

  // ── Weighted total ──────────────────────────────────────────────────────
  const groupScore = Math.round(
    deadlineScore * weights.deadlinePerformance +
    featureScore * weights.featureCompletion +
    taskScore * weights.taskCompletion +
    meetingScore * weights.meetingEngagement +
    codeScore * weights.codeContribution +
    proposalScore * weights.proposalQuality
  );

  const groupGrade = {
    score: Math.min(groupScore, 100),
    maxScore: 100,
    breakdown: {
      deadlinePerformance: Math.round(deadlineScore),
      featureCompletion: Math.round(featureScore),
      taskCompletion: Math.round(taskScore),
      meetingEngagement: Math.round(meetingScore),
      codeContribution: Math.round(codeScore),
      proposalQuality: Math.round(proposalScore),
    },
  };

  // ── Individual member grades ────────────────────────────────────────────
  const members = populatedGroup.members || [];
  const totalCompletedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalCommits = populatedGroup.github?.totalCommits || 0;

  const memberGrades = members.map((m) => {
    const memberId = String(m.user?._id || m.user);

    const myFeatures = features.filter((f) => String(f.implementedBy) === memberId).length;
    const myCompletedTasks = tasks.filter(
      (t) => String(t.assignedTo) === memberId && t.status === "completed"
    ).length;
    const myMeetings = meetings.filter((mtg) =>
      (mtg.attendees || []).some((a) => String(a._id || a) === memberId)
    ).length;

    let myCommits = 0;
    if (populatedGroup.github?.commits) {
      const memberEmails = [m.user?.email].filter(Boolean);
      populatedGroup.github.commits.forEach((c) => {
        if (memberEmails.includes(c.authorEmail)) {
          myCommits += c.count || 0;
        }
      });
    }

    const featPct = features.length > 0 ? (myFeatures / features.length) * 100 : 0;
    const taskPct = totalCompletedTasks > 0 ? (myCompletedTasks / totalCompletedTasks) * 100 : 0;
    const meetPct = meetings.length > 0 ? (myMeetings / meetings.length) * 100 : 0;
    const commitPct = totalCommits > 0 ? (myCommits / totalCommits) * 100 : 0;

    const contributionFactor = (
      featPct * mWeights.featuresImplemented +
      taskPct * mWeights.tasksCompleted +
      meetPct * mWeights.meetingAttendance +
      commitPct * mWeights.githubCommits
    ) / 100;

    // Individual score = group score adjusted by contribution factor
    // If everyone contributed equally, factor ≈ 1/memberCount * memberCount = 1
    const equalShare = members.length > 0 ? 1 / members.length : 1;
    const adjustmentRatio = contributionFactor > 0
      ? Math.min(contributionFactor / equalShare, 1.2) // cap at 120% of group score
      : 0;

    const individualScore = Math.round(Math.min(groupGrade.score * adjustmentRatio, 100));

    return {
      student: m.user?._id || m.user,
      studentName: m.user?.name || "Unknown",
      studentEmail: m.user?.email || "",
      score: individualScore,
      maxScore: 100,
      breakdown: {
        featuresImplemented: myFeatures,
        tasksCompleted: myCompletedTasks,
        meetingAttendance: myMeetings,
        githubCommits: myCommits,
      },
      teacherAdjustment: 0,
      teacherNote: "",
    };
  });

  return { groupGrade, memberGrades };
};

// ─── 3. Save Evaluation ───────────────────────────────────────────────────────

const saveEvaluation = async (projectId, teacherId, payload) => {
  const { project, group } = await verifyProjectSupervisor(projectId, teacherId);

  const { groupGrade, memberGrades, status } = payload;

  if (status === "published" && (!groupGrade || groupGrade.score === null)) {
    throw new ApiError(400, "Cannot publish evaluation without a group grade");
  }

  let evaluation = await Evaluation.findOne({ project: projectId });

  if (evaluation && evaluation.status === "published") {
    throw new ApiError(400, "This evaluation has already been published and cannot be modified");
  }

  if (status === "published") {
    const policy = await getCompletionPolicyForGroup(group);
    const metricsResult = await calculateCompletionMetrics(projectId, teacherId, {
      completionCriteria: policy.completionCriteria,
    });

    const checks = getPublishEligibilityChecks({ project, metricsResult });
    const failedChecks = checks.filter((c) => !c.passed);

    if (failedChecks.length > 0) {
      throw new ApiError(400, "Evaluation cannot be published until readiness requirements are met", {
        failedChecks,
        readinessScore: calculateReadinessScore(checks),
      });
    }
  }

  if (!evaluation) {
    evaluation = new Evaluation({
      project: projectId,
      group: group._id,
      evaluatedBy: teacherId,
    });
  }

  evaluation.groupGrade = groupGrade;
  evaluation.memberGrades = memberGrades || [];
  evaluation.evaluatedBy = teacherId;

  if (status === "published") {
    evaluation.status = "published";
    evaluation.publishedAt = new Date();
  }

  await logEvaluationActivity(evaluation, {
    type: status === "published" ? "published" : "draft_saved",
    actorId: teacherId,
    note: status === "published" ? "Evaluation published" : "Draft saved",
  });

  await evaluation.save();
  return evaluation;
};

const requestSecondReview = async (projectId, teacherId, payload = {}) => {
  const { group } = await verifyProjectSupervisor(projectId, teacherId);
  const { secondReviewerId, note = "" } = payload;

  if (!secondReviewerId) {
    throw new ApiError(400, "secondReviewerId is required");
  }

  const [evaluation, secondReviewer] = await Promise.all([
    Evaluation.findOne({ project: projectId }),
    User.findById(secondReviewerId).select("_id role"),
  ]);

  if (!evaluation) {
    throw new ApiError(404, "Create or save an evaluation draft before requesting second review");
  }
  if (evaluation.status === "published") {
    throw new ApiError(400, "Published evaluation cannot enter second review");
  }
  if (!secondReviewer || secondReviewer.role !== "teacher") {
    throw new ApiError(400, "Second reviewer must be an existing teacher");
  }
  if (String(secondReviewer._id) === String(teacherId)) {
    throw new ApiError(400, "Supervisor cannot assign themselves as second reviewer");
  }

  evaluation.status = "pending_second_review";
  evaluation.moderation = {
    required: true,
    secondReviewer: secondReviewer._id,
    requestedBy: teacherId,
    requestedAt: new Date(),
    decision: "pending",
    decisionNote: note,
    decidedBy: null,
    decidedAt: null,
  };

  await logEvaluationActivity(evaluation, {
    type: "second_review_requested",
    actorId: teacherId,
    note: `Second review requested from ${secondReviewer.name || secondReviewerId}`,
    metadata: { secondReviewerId },
  });

  await evaluation.save();
  return evaluation;
};

const submitSecondReviewDecision = async (projectId, reviewerId, payload = {}) => {
  const { decision, note = "" } = payload;
  const normalizedDecision = String(decision || "").toLowerCase();

  if (!["approved", "rejected"].includes(normalizedDecision)) {
    throw new ApiError(400, "Decision must be either 'approved' or 'rejected'");
  }

  const evaluation = await Evaluation.findOne({ project: projectId });
  if (!evaluation) throw new ApiError(404, "Evaluation not found");
  if (evaluation.status !== "pending_second_review") {
    throw new ApiError(400, "Evaluation is not pending second review");
  }

  const assignedReviewerId = evaluation.moderation?.secondReviewer;
  if (!assignedReviewerId || String(assignedReviewerId) !== String(reviewerId)) {
    throw new ApiError(403, "You are not assigned as the second reviewer for this evaluation");
  }

  evaluation.moderation.decision = normalizedDecision;
  evaluation.moderation.decisionNote = note;
  evaluation.moderation.decidedBy = reviewerId;
  evaluation.moderation.decidedAt = new Date();

  if (normalizedDecision === "approved") {
    evaluation.status = "published";
    evaluation.publishedAt = new Date();
  } else {
    evaluation.status = "draft";
  }

  await logEvaluationActivity(evaluation, {
    type: "moderation_decision",
    actorId: reviewerId,
    note: `Moderation ${normalizedDecision}: ${note}`,
    metadata: { decision: normalizedDecision, note },
  });

  await evaluation.save();
  return evaluation;
};

// ─── 4. Get Evaluation ────────────────────────────────────────────────────────

const getEvaluation = async (projectId, teacherId) => {
  await verifyProjectSupervisor(projectId, teacherId);
  const evaluation = await Evaluation.findOne({ project: projectId })
    .populate("evaluatedBy", "name email")
    .populate("memberGrades.student", "name email")
    .populate("activities.actor", "name email role")
    .lean();
  return evaluation;
};

// ─── 5. Student Get Evaluation (published only) ──────────────────────────────

const getStudentEvaluation = async (projectId) => {
  const evaluation = await Evaluation.findOne({
    project: projectId,
    status: "published",
  })
    .populate("evaluatedBy", "name")
    .populate("memberGrades.student", "name email")
    .populate("activities.actor", "name email role")
    .lean();
  return evaluation; // null if not published
};

// ─── 6. Mark Project Completed ────────────────────────────────────────────────

const markProjectCompleted = async (projectId, teacherId) => {
  const readiness = await evaluateCompletionReadiness(projectId, teacherId, {
    requirePublishedEvaluation: true,
  });

  const { project, group, checks, failedChecks, readinessScore, decision } = readiness;

  if (project.status === "completed") {
    throw new ApiError(400, "Project is already completed");
  }

  if (decision === "deny") {
    await createCompletionAudit({
      projectId: project._id,
      groupId: group._id,
      actorId: teacherId,
      decision: "deny",
      reason: "Completion blocked by readiness policy checks",
      checks,
      readinessScore,
    });

    throw new ApiError(400, "Project is not eligible for completion yet", {
      readinessScore,
      failedChecks,
    });
  }

  project.status = "completed";
  await project.save();

  await createCompletionAudit({
    projectId: project._id,
    groupId: group._id,
    actorId: teacherId,
    decision: "allow",
    reason: "Completion approved by readiness policy checks",
    checks,
    readinessScore,
  });

  return project;
};

// ─── 7. Class Benchmarks ──────────────────────────────────────────────────────
const calculateClassBenchmarks = async (projectId) => {
  const targetProject = await Project.findById(projectId).populate("group");
  if (!targetProject || !targetProject.group) return null;

  const { department, semester } = targetProject.group;

  // Find all projects in the same cohort
  const cohortGroups = await Group.find({ department, semester }).select("_id");
  const cohortGroupIds = cohortGroups.map(g => g._id);

  const cohortProjects = await Project.find({
    group: { $in: cohortGroupIds }
  }).select("completionMetrics");

  const validMetrics = cohortProjects
    .map(p => p.completionMetrics)
    .filter(m => m && m.tasksTotal !== undefined);

  if (validMetrics.length === 0) return null;

  const count = validMetrics.length;
  const sums = validMetrics.reduce((acc, m) => ({
    tasks: acc.tasks + (m.tasksCompleted || 0),
    meetings: acc.meetings + (m.meetingsHeld || 0),
    commits: acc.commits + (m.codeContribution || 0), // Use codeContribution score as proxy if commits not raw
    features: acc.features + (m.featuresCompleted || 0)
  }), { tasks: 0, meetings: 0, commits: 0, features: 0 });

  const averages = {
    avgTasks: Math.round(sums.tasks / count),
    avgMeetings: Math.round(sums.meetings / count),
    avgFeatures: Math.round(sums.features / count)
  };

  // Sort for top 10% (90th percentile)
  const sortedTasks = validMetrics.map(m => m.tasksCompleted || 0).sort((a, b) => b - a);
  const sortedMeetings = validMetrics.map(m => m.meetingsHeld || 0).sort((a, b) => b - a);
  
  const top10Idx = Math.max(0, Math.floor(count * 0.1));

  return {
    averages,
    topPerformerThresholds: {
      tasks: sortedTasks[top10Idx] || 0,
      meetings: sortedMeetings[top10Idx] || 0
    },
    cohortCount: count
  };
};

export {
  calculateCompletionMetrics,
  calculateSuggestedGrades,
  saveEvaluation,
  requestSecondReview,
  submitSecondReviewDecision,
  getEvaluation,
  getStudentEvaluation,
  evaluateCompletionReadiness,
  markProjectCompleted,
  calculateClassBenchmarks
};
