import Signal from "../../models/signal.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import apiError from "../../utils/apiError.js";
import * as analyticsService from "../../services/admin/analytics.service.js";
import * as aiService from "../../services/ai.service.js";
import Group from "../../models/group.model.js";
import { createNotification } from "../../services/notification.service.js";
import { sendEmail } from "../../services/email.service.js";
import config from "../../config/env.js";
import intelligenceService from "../../services/intelligence.service.js";

const universityName = config.universityName || "University";

/**
 * @desc    Get system-wide analytics
 * @route   GET /api/v1/admin/analytics
 * @access  Private (Admin only)
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getDashboardStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get at-risk groups
 * @route   GET /api/v1/admin/analytics/at-risk
 * @access  Private (Admin only)
 */
export const getAtRiskGroups = asyncHandler(async (req, res) => {
  const atRisk = await analyticsService.getAtRiskGroups();

  res.status(200).json({
    success: true,
    data: atRisk,
  });
});

/**
 * Build a dynamic warning message based on the issues array
 */
const buildWarningTemplates = (groupName, issues = []) => {
  const issueLines = issues.map((issue) => `• ${issue}`).join("\n");
  const issueLinesHtml = issues
    .map((issue) => `<li style="margin-bottom:6px;">${issue}</li>`)
    .join("");

  const title = `⚠️ At-Risk Warning: ${groupName}`;
  const text = [
    `Hello Team,`,
    ``,
    `Your group "${groupName}" has been flagged as at-risk by the system administrator due to the following issues:`,
    ``,
    issueLines,
    ``,
    `Please address these issues immediately. You can log in to the system to take action.`,
    ``,
    `${universityName} Administration`,
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,0.12);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,#ef4444);padding:28px 32px;">
                  <div style="color:#ffffff;font-size:20px;font-weight:700;">${universityName} – At-Risk Warning</div>
                  <div style="color:#fca5a5;font-size:13px;margin-top:6px;">Action Required</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <div style="font-size:18px;color:#0f172a;font-weight:700;margin-bottom:10px;">Dear Members of ${groupName},</div>
                  <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:18px;">
                    Your group has been flagged as <strong style="color:#ef4444;">at-risk</strong> by the system administrator. Please review the following issues and take immediate action.
                  </div>
                  <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:18px 20px;margin-bottom:18px;">
                    <div style="font-size:12px;color:#b91c1c;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:700;">Issues Identified</div>
                    <ul style="margin:0;padding-left:18px;font-size:14px;color:#7f1d1d;line-height:1.8;">
                      ${issueLinesHtml}
                    </ul>
                  </div>
                  <div style="font-size:13px;color:#64748b;">Please log in to the system and resolve these issues as soon as possible.</div>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px;background-color:#f1f5f9;color:#64748b;font-size:12px;">
                  This is an automated warning from ${universityName} Administration.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { subject: title, text, html };
};

/**
 * @desc    Warn an at-risk group with dynamic notification + email
 * @route   POST /api/v1/admin/analytics/at-risk/:groupId/warn
 * @access  Private (Admin only)
 */
export const warnGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { issues = [] } = req.body;

  const group = await Group.findById(groupId).populate({
    path: "members.user",
    select: "name email",
  });

  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found." });
  }

  const members = (group.members || []).map((m) => m.user).filter(Boolean);

  if (members.length === 0) {
    return res.status(200).json({ success: true, message: "No members to notify." });
  }

  const emailTemplate = buildWarningTemplates(group.name, issues);
  const issuesSummary =
    issues.length > 0
      ? issues.join("; ")
      : "Your group has been flagged as at-risk.";

  await Promise.all(
    members.map(async (user) => {
      // In-app notification
      await createNotification({
        user: user._id,
        title: `⚠️ At-Risk Warning: ${group.name}`,
        message: `Admin alert: ${issuesSummary}`,
        type: "general",
        priority: "high",
        link: "/student/tasks",
      });

      // Email
      await sendEmail({ to: user.email, ...emailTemplate });
    }),
  );

  res.status(200).json({
    success: true,
    message: `Warning sent to ${members.length} member(s) of ${group.name}.`,
    notified: members.length,
  });
});

/**
 * @desc    Get AI-generated system analytics narrative
 * @route   GET /api/v1/admin/analytics/narrative
 * @access  Private (Admin only)
 */
export const getAnalyticsNarrative = asyncHandler(async (req, res) => {
  const [stats, riskReport] = await Promise.all([
    analyticsService.getDashboardStats(),
    analyticsService.getAtRiskGroups()
  ]);

  const narrative = await aiService.generateAdminAnalyticsNarrativeAI({
    stats,
    riskReport
  });

  res.status(200).json({
    success: true,
    data: narrative
  });
});

/**
 * @desc    Get AI-driven strategic capacity analysis
 * @route   GET /api/v1/admin/analytics/strategic-capacity
 * @access  Private (Admin only)
 */
export const getStrategicCapacityAnalysis = asyncHandler(async (req, res) => {
  const data = await analyticsService.getStrategicCapacityData();

  const analysis = await aiService.generateStrategicCapacityAnalysisAI({
    faculty: data.faculty,
    pendingGroups: data.pendingGroups,
  });

  res.status(200).json({
    success: true,
    data: analysis,
  });
});

/**
 * @desc    Run system-wide integrity and SLA audit
 * @route   POST /api/v1/admin/analytics/run-audit
 * @access  Private (Admin only)
 */
export const runSystemAudit = asyncHandler(async (req, res) => {
  const escalationService = (await import("../../services/escalation.service.js")).default;
  const integrityService = (await import("../../services/integrity.service.js")).default;

  const [milestoneSignals, evaluationSignals] = await Promise.all([
    escalationService.checkMilestoneSLA(),
    escalationService.checkEvaluationLatency(),
  ]);

  res.status(200).json({
    success: true,
    message: "System audit completed successfully.",
    data: {
      newSlaSignals: milestoneSignals + evaluationSignals,
      categories: {
        milestones: milestoneSignals,
        evaluations: evaluationSignals
      }
    },
  });
});

/**
 * @desc    Get all active/history signals
 * @route   GET /api/v1/admin/analytics/signals
 * @access  Private (Admin only)
 */
export const getSignals = asyncHandler(async (req, res) => {
  const { status = "open", type, limit = 50 } = req.query;
  const query = { status };
  if (type) query.type = type;

  const signals = await Signal.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate("project", "title")
    .populate("group", "name")
    .populate("resolvedBy", "name email role");

  res.status(200).json({
    success: true,
    message: "Signals fetched successfully",
    data: signals,
  });
});

/**
 * @desc    Mark a signal as resolved
 * @route   PATCH /api/v1/admin/analytics/signals/:signalId/resolve
 * @access  Private (Admin only)
 */
export const resolveSignal = asyncHandler(async (req, res) => {
  const { signalId } = req.params;
  const { note, actions = {} } = req.body;

  const signal = await Signal.findById(signalId).populate("group").populate("project");
  if (!signal) {
    throw new apiError(404, "Signal not found");
  }

  const group = signal.group;
  const project = signal.project;
  let tacticalLog = [];

  // Action 1: Emit Formal Warning to Students
  if (actions.warnStudents && group) {
    const issues = [signal.message];
    const groupWithMembers = await Group.findById(group._id).populate("members.user");
    const members = (groupWithMembers.members || []).map((m) => m.user).filter(Boolean);
    
    if (members.length > 0) {
      const emailTemplate = buildWarningTemplates(group.name, issues);
      await Promise.all(
        members.map(async (user) => {
          await createNotification({
            user: user._id,
            title: `⚠️ Formal Governance Warning: ${group.name}`,
            message: `Official alert regarding: ${signal.message}. Admin action required.`,
            type: "general",
            priority: "high",
            link: "/student/tasks",
          });
          await sendEmail({ to: user.email, ...emailTemplate });
        })
      );
      tacticalLog.push("Formal warning issued to student members");
    }
  }

  // Action 2: Escalate to Supervisor
  if (actions.escalateSupervisor && group) {
    const groupWithSupervisor = await Group.findById(group._id).populate("supervisor");
    const supervisor = groupWithSupervisor.supervisor;
    
    if (supervisor && supervisor.email) {
      const title = `🚨 Governance Escalation: Group ${group.name}`;
      const text = `Administrator escalation regarding Group "${group.name}".\nIncident: ${signal.message}\nNote: ${note || "None"}`;
      const html = `
        <div style="font-family:sans-serif;padding:24px;background-color:#fef2f2;border-radius:16px;">
          <h2 style="color:#b91c1c;margin-top:0;">Governance Escalation</h2>
          <p>You are being notified of a high-priority incident regarding <strong>Group ${group.name}</strong>.</p>
          <div style="background-color:#ffffff;padding:16px;border-radius:8px;border-left:4px solid #ef4444;margin:16px 0;">
            <p style="margin:0;font-weight:700;color:#0f172a;">Incident: ${signal.message}</p>
          </div>
          <p style="font-size:14px;color:#475569;">Admin Action Note: ${note || "N/A"}</p>
          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">This is a system-generated governance alert.</p>
        </div>
      `;
      
      await createNotification({
        user: supervisor._id,
        title: `🚨 Escalation: ${group.name}`,
        message: `High-priority governance alert regarding: ${signal.message}`,
        type: "general",
        priority: "high",
      });
      await sendEmail({ to: supervisor.email, subject: title, text, html });
      tacticalLog.push("Incident escalated to faculty supervisor");
    }
  }

  signal.status = "resolved";
  const finalNote = [note, tacticalLog.length > 0 ? `[Tactical Actions: ${tacticalLog.join(", ")}]` : null]
    .filter(Boolean)
    .join("\n\n");
    
  signal.resolutionNote = finalNote || "Resolved by administrator";
  signal.resolvedAt = new Date();
  signal.resolvedBy = req.user._id;

  await signal.save();

  res.status(200).json({
    success: true,
    message: "Signal resolved and tactical protocols executed.",
    data: signal,
  });
});

/**
 * @desc    Get predictive health forecast for a specific group
 * @route   GET /api/v1/admin/analytics/groups/:groupId/health-forecast
 * @access  Private (Admin only)
 */
export const getGroupHealthForecast = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const forecast = await intelligenceService.getProjectHealthForecast(groupId);

  if (!forecast) {
    res.status(404).json({ success: false, message: "Group health telemetry unavailable." });
    return;
  }

  res.status(200).json({
    success: true,
    data: forecast,
  });
});


