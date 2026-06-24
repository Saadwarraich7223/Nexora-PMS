import Evaluation from "../../models/evaluation.model.js";
import Group from "../../models/group.model.js";
import User from "../../models/user.model.js";
import GradeChallenge from "../../models/gradeChallenge.model.js";
import ApiError from "../../utils/apiError.js";

/**
 * Get system-wide evaluation statistics (Tier 1)
 */
export const getEvaluationStats = async () => {
  const [publishedCount, draftCount, allPublished] = await Promise.all([
    Evaluation.countDocuments({ status: "published" }),
    Evaluation.countDocuments({ status: "draft" }),
    Evaluation.find({ status: "published" }).select("groupGrade.score").lean(),
  ]);

  let avgGroupScore = 0;
  const distribution = {
    "0-39": 0,
    "40-59": 0,
    "60-79": 0,
    "80-100": 0,
  };

  if (allPublished.length > 0) {
    let totalScore = 0;
    allPublished.forEach((e) => {
      const score = e.groupGrade?.score || 0;
      totalScore += score;
      if (score < 40) distribution["0-39"]++;
      else if (score < 60) distribution["40-59"]++;
      else if (score < 80) distribution["60-79"]++;
      else distribution["80-100"]++;
    });
    avgGroupScore = Math.round(totalScore / allPublished.length);
  }

  // Pending groups (groups that are active but have no evaluation doc at all)
  const activeGroupsCount = await Group.countDocuments({ status: "active" });
  const evaluatedGroupsCount = publishedCount + draftCount;
  const pendingCount = Math.max(0, activeGroupsCount - evaluatedGroupsCount);

  return {
    published: publishedCount,
    drafts: draftCount,
    pending: pendingCount,
    avgScore: avgGroupScore,
    distribution,
  };
};

/**
 * Get all evaluations with rich population for Tier 2 Analytics
 */
export const getAllEvaluations = async () => {
  const evaluations = await Evaluation.find()
    .populate({
      path: "project",
      select: "title group",
      populate: {
        path: "group",
        select: "name department semester supervisor",
        populate: {
          path: "supervisor",
          select: "name email",
        },
      },
    })
    .lean();

  return evaluations;
};

/**
 * Get evaluation metrics aggregated by Department
 */
export const getEvaluationsByDepartment = async () => {
  const evaluations = await getAllEvaluations();
  const publishedEvals = evaluations.filter((e) => e.status === "published" && e.project?.group);

  const deptStats = {};

  publishedEvals.forEach((e) => {
    const dept = e.project.group.department || "Unknown";
    const score = e.groupGrade?.score || 0;

    if (!deptStats[dept]) {
      deptStats[dept] = { department: dept, count: 0, totalScore: 0, passed: 0 };
    }

    deptStats[dept].count++;
    deptStats[dept].totalScore += score;
    if (score >= 60) deptStats[dept].passed++;
  });

  return Object.values(deptStats).map((d) => ({
    department: d.department,
    evaluatedGroups: d.count,
    avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
    passRate: d.count > 0 ? Math.round((d.passed / d.count) * 100) : 0,
  }));
};

/**
 * Get evaluation metrics aggregated by Supervisor
 */
export const getEvaluationsBySupervisor = async () => {
  const evaluations = await getAllEvaluations();
  const supervisorStats = {};

  evaluations.forEach((e) => {
    if (!e.project?.group?.supervisor) return;
    const supId = e.project.group.supervisor._id.toString();
    const supName = e.project.group.supervisor.name;

    if (!supervisorStats[supId]) {
      supervisorStats[supId] = {
        supervisorId: supId,
        supervisorName: supName,
        totalAssigned: 0,
        drafts: 0,
        published: 0,
        totalScore: 0,
      };
    }

    supervisorStats[supId].totalAssigned++;
    
    if (e.status === "draft") supervisorStats[supId].drafts++;
    if (e.status === "published") {
      supervisorStats[supId].published++;
      supervisorStats[supId].totalScore += (e.groupGrade?.score || 0);
    }
  });

  return Object.values(supervisorStats).map((s) => ({
    supervisorId: s.supervisorId,
    supervisorName: s.supervisorName,
    publishedCount: s.published,
    draftCount: s.drafts,
    avgScore: s.published > 0 ? Math.round(s.totalScore / s.published) : 0,
  })).sort((a, b) => b.publishedCount - a.publishedCount);
};

export const getGradeChallenges = async ({ status } = {}) => {
  const query = {};
  if (status) query.status = status;

  return GradeChallenge.find(query)
    .populate("project", "title")
    .populate("group", "name department semester")
    .populate("submittedBy", "name email")
    .populate("resolution.decidedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

export const resolveGradeChallenge = async (challengeId, adminId, payload = {}) => {
  const decision = String(payload.decision || "").toLowerCase();
  if (!["resolved", "rejected", "under_review"].includes(decision)) {
    throw new ApiError(400, "Decision must be one of: resolved, rejected, under_review");
  }

  const challenge = await GradeChallenge.findById(challengeId);
  if (!challenge) throw new ApiError(404, "Grade challenge not found");

  challenge.status = decision;
  challenge.resolution = {
    decidedBy: adminId,
    note: String(payload.note || "").trim(),
    decidedAt: new Date(),
  };

  await challenge.save();

  // Log activity on evaluation
  const evaluationDoc = await Evaluation.findById(challenge.evaluation);
  if (evaluationDoc) {
    evaluationDoc.activities.push({
      type: "challenge_resolved",
      status: evaluationDoc.status,
      actor: adminId,
      timestamp: new Date(),
      note: `Grade challenge ${decision}: ${payload.note || ""}`,
      metadata: { challengeId: challenge._id, decision },
    });
    await evaluationDoc.save();
  }

  return challenge;
};
