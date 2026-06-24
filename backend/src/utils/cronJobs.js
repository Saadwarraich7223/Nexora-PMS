import cron from "node-cron";
import Task from "../models/task.model.js";
import Group from "../models/group.model.js";
import Deadline from "../models/deadline.model.js";
import MeetingLog from "../models/meetingLog.model.js";
import Project from "../models/project.model.js";
import { createNotification } from "../services/notification.service.js";
import { sendEmail } from "../services/email.service.js";
import aiService from "../services/ai.service.js";
import ragService from "../services/rag.service.js";
import { syncAllGithubData } from "../services/student/github.service.js";
import config from "../config/env.js";
import { logger } from './logger.js';


const universityName = config.universityName || "University";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const msPerDay = 24 * 60 * 60 * 1000;

const daysUntil = (date) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / msPerDay);
};

const buildDeadlineReminderEmail = ({
  recipientName,
  taskTitle,
  daysLeft,
  isOverdue,
}) => {
  const subject = isOverdue
    ? `⚠️ Overdue Task: "${taskTitle}"`
    : `⏰ Reminder: Task "${taskTitle}" due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

  const statusColor = isOverdue
    ? "#ef4444"
    : daysLeft <= 1
      ? "#f59e0b"
      : "#3b82f6";
  const statusLabel = isOverdue
    ? "OVERDUE"
    : `Due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

  const html = `
    <div style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,0.12);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,${statusColor});padding:28px 32px;">
                  <div style="color:#ffffff;font-size:20px;font-weight:700;">${universityName} – Task Reminder</div>
                  <div style="color:#e2e8f0;font-size:13px;margin-top:6px;">${statusLabel}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <div style="font-size:18px;color:#0f172a;font-weight:700;margin-bottom:10px;">Hello, ${recipientName}</div>
                  <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:18px;">
                    ${
                      isOverdue
                        ? `Your assigned task <strong>"${taskTitle}"</strong> is <span style="color:#ef4444;font-weight:bold;">overdue</span>. Please update its status or complete it as soon as possible.`
                        : `Your assigned task <strong>"${taskTitle}"</strong> is due in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>. Make sure you complete it on time.`
                    }
                  </div>
                  <div style="background-color:#f8fafc;border-left:4px solid ${statusColor};border-radius:8px;padding:14px 18px;">
                    <div style="font-size:13px;color:#0f172a;font-weight:700;">Task: ${taskTitle}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">${statusLabel}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px;background-color:#f1f5f9;color:#64748b;font-size:12px;">
                  This is an automated reminder from ${universityName} PMS.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { subject, text: subject, html };
};

const buildProjectDeadlineReminderEmail = ({
  recipientName,
  deadlineTitle,
  daysLeft,
  isOverdue,
}) => {
  const subject = isOverdue
    ? `⚠️ Overdue Project Deadline: "${deadlineTitle}"`
    : `📅 Reminder: Project Deadline "${deadlineTitle}" in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

  const statusColor = isOverdue ? "#ef4444" : "#8b5cf6";
  const statusLabel = isOverdue
    ? "OVERDUE"
    : `Due in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;

  const html = `
    <div style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,0.12);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,${statusColor});padding:28px 32px;">
                  <div style="color:#ffffff;font-size:20px;font-weight:700;">${universityName} – Project Deadline Reminder</div>
                  <div style="color:#e2e8f0;font-size:13px;margin-top:6px;">${statusLabel}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <div style="font-size:18px;color:#0f172a;font-weight:700;margin-bottom:10px;">Hello, ${recipientName}</div>
                  <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:18px;">
                    ${
                      isOverdue
                        ? `The project deadline <strong>"${deadlineTitle}"</strong> has passed and your group has not met it. Please reach out to your supervisor.`
                        : `Your group has a project deadline <strong>"${deadlineTitle}"</strong> approaching in <strong>${daysLeft} day${daysLeft > 1 ? "s" : ""}</strong>. Ensure your group is on track.`
                    }
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px;background-color:#f1f5f9;color:#64748b;font-size:12px;">
                  This is an automated reminder from ${universityName} PMS.
                 </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return {
    subject,
    text: subject,
    html,
  };
};
const runAutonomousAudit = async () => {
  logger.info("[CRON] Running autonomous AI project audit...");
  try {
    const activeGroups = await Group.find({ status: "active" })
      .populate("supervisor", "name email")
      .populate("members.user", "name email");

    for (const group of activeGroups) {
      if (!group.supervisor) continue;

      // 1. Gather Task Stats
      const tasks = await Task.find({ group: group._id });
      const stats = {
        total: tasks.length,
        completed: tasks.filter((t) => ["completed", "done"].includes(t.status))
          .length,
        overdue: tasks.filter(
          (t) =>
            t.deadline &&
            new Date(t.deadline) < new Date() &&
            !["completed", "done"].includes(t.status),
        ).length,
      };

      // 2. Gather Recent Meetings & AI Summaries
      const recentLogs = await MeetingLog.find({ group: group._id })
        .sort({ date: -1 })
        .limit(3);

      const auditPayload = {
        groupName: group.name,
        projectTitle: group.projectTitle || "Untitled Project",
        stats,
        recentMeetings: recentLogs.map((l) => ({
          date: l.date,
          agenda: l.agenda,
        })),
        recentSummaries: recentLogs
          .filter((l) => l.aiSummary)
          .map((l) => l.aiSummary.executiveSummary),
      };

      // 3. Gather Historical Context via RAG
      const historicalArchive = await Project.find({
        group: { $ne: group._id },
        status: { $in: ["completed", "rejected", "in_progress"] },
      })
        .limit(10)
        .select("title description status completionMetrics healthReport");

      const historicalContext = await ragService.getHistoricalHealthContext(
        { ...stats, meetingCount: recentLogs.length },
        historicalArchive,
      );

      // 4. Generate AI Digest
      const digest = await aiService.generateProjectAuditAI({
        ...auditPayload,
        historicalContext,
      });

      // 4. Dispatch Notifications (Only if At-Risk, Stalled, or Critical)
      if (["At-Risk", "Stalled", "Critical"].includes(digest.healthStatus)) {
        await createNotification({
          user: group.supervisor._id,
          title: `Autonomous Audit: ${group.name} is ${digest.healthStatus}`,
          message: digest.executiveDigest,
          type: "alert",
          priority: digest.healthStatus === "Critical" ? "high" : "medium",
          link: `/teacher/groups`,
        });

        // Email Supervisor
        await sendEmail({
          to: group.supervisor.email,
          subject: `[AUDIT ALERT] Group "${group.name}" flagged as ${digest.healthStatus}`,
          html: `
            <h3>Autonomous Auditor Health Report</h3>
            <p><strong>Status:</strong> ${digest.healthStatus}</p>
            <p><strong>Velocity Score:</strong> ${digest.velocityScore}%</p>
            <p>${digest.executiveDigest}</p>
            <h4>Critical Flags:</h4>
            <ul>${digest.criticalFlags.map((f) => `<li>${f}</li>`).join("")}</ul>
            <h4>Recommendations:</h4>
            <ul>${digest.supervisorRecommendations.map((r) => `<li>${r}</li>`).join("")}</ul>
          `,
        });
      }
    }
    logger.info(
      `[CRON] Autonomous audit complete for ${activeGroups.length} groups.`,
    );
  } catch (err) {
    logger.error("[CRON] Error in autonomous audit job:", err.message);
  }
};

const runTaskReminders = async () => {
  logger.info("[CRON] Running task reminders...");
  try {
    const tasks = await Task.find({
      status: { $in: ["todo", "in-progress"] },
      deadline: { $exists: true, $ne: null },
    }).populate("assignedTo", "name email");

    for (const task of tasks) {
      const daysLeft = daysUntil(task.deadline);
      if (daysLeft === 1 || daysLeft === 3 || daysLeft < 0) {
        const isOverdue = daysLeft < 0;
        for (const user of task.assignedTo) {
          // Notification
          await createNotification({
            user: user._id,
            title: isOverdue ? "Overdue Task" : "Upcoming Task",
            message: `Task "${task.title}" is ${isOverdue ? "overdue" : "due in " + daysLeft + " days"}.`,
            type: "alert",
            priority: isOverdue ? "high" : "medium",
          });

          // Email
          const email = buildDeadlineReminderEmail({
            recipientName: user.name,
            taskTitle: task.title,
            daysLeft,
            isOverdue,
          });
          await sendEmail({
            to: user.email,
            subject: email.subject,
            html: email.html,
          });
        }
      }
    }
  } catch (err) {
    logger.error("[CRON] Task reminder error:", err.message);
  }
};

const runDeadlineReminders = async () => {
  logger.info("[CRON] Running deadline reminders...");
  try {
    const deadlines = await Deadline.find({
      status: { $ne: "completed" },
    }).populate({
        path: "group",
        populate: { path: "members.user", select: "name email" }
    });

    for (const d of deadlines) {
      const daysLeft = daysUntil(d.dueDate);
      if (daysLeft === 1 || daysLeft === 2 || daysLeft < 0) {
        const isOverdue = daysLeft < 0;
        if (!d.group?.members) continue;

        for (const member of d.group.members) {
          const user = member.user;
          if (!user) continue;

          await createNotification({
            user: user._id,
            title: isOverdue ? "Overdue Deadline" : "Approaching Deadline",
            message: `Project Deadline "${d.title}" is ${isOverdue ? "overdue" : "due in " + daysLeft + " days"}.`,
            type: "alert",
          });

          const email = buildProjectDeadlineReminderEmail({
            recipientName: user.name,
            deadlineTitle: d.title,
            daysLeft,
            isOverdue,
          });
          await sendEmail({
            to: user.email,
            subject: email.subject,
            html: email.html,
          });
        }
      }
    }
  } catch (err) {
    logger.error("[CRON] Deadline reminder error:", err.message);
  }
};

const runProactiveInactivityCheck = async () => {
  logger.info("[CRON] Running proactive inactivity checks...");
  try {
    const activeGroups = await Group.find({ status: "active" }).populate("supervisor", "name email");
    const twoWeeksAgo = new Date(Date.now() - 14 * msPerDay);
    const oneWeekAgo = new Date(Date.now() - 7 * msPerDay);

    for (const group of activeGroups) {
      // 1. Meeting Inactivity Check (14 days)
      const lastMeeting = await MeetingLog.findOne({ group: group._id }).sort({ date: -1 });
      if (!lastMeeting || new Date(lastMeeting.date) < twoWeeksAgo) {
        if (group.supervisor) {
          await createNotification({
            user: group.supervisor._id,
            title: "Meeting Inactivity Alert",
            message: `Group "${group.name}" has not logged any meeting in the last 14 days. Please check their progress.`,
            type: "alert",
            priority: "medium",
            link: `/teacher/groups`
          });
        }
      }

      // 2. Student Inactivity Check (7 days)
      const groupIncompleteTasks = await Task.find({ 
        group: group._id, 
        status: { $in: ["todo", "in-progress", "open"] } 
      }).populate("assignedTo", "name email");

      // Check each member's recent completions
      for (const member of group.members) {
        const userId = member.user?._id || member.user;
        const recentCompletion = await Task.findOne({
          group: group._id,
          assignedTo: userId,
          status: { $in: ["completed", "done"] },
          updatedAt: { $gte: oneWeekAgo }
        });

        if (!recentCompletion) {
          // Check if they have many pending tasks
          const pendingCount = await Task.countDocuments({
            group: group._id,
            assignedTo: userId,
            status: { $in: ["todo", "in-progress", "open"] }
          });

          if (pendingCount > 0 && group.supervisor) {
            await createNotification({
              user: group.supervisor._id,
              title: "Student Stalling Alert",
              message: `Student(s) in group "${group.name}" have not completed any tasks in the last 7 days despite having pending work.`,
              type: "alert",
              priority: "medium",
              link: `/teacher/groups`
            });
            break; // Notify supervisor once per group for student stalling
          }
        }
      }
    }
  } catch (err) {
    logger.error("[CRON] Proactive inactivity check error:", err.message);
  }
};

const runGithubAutoSync = async () => {
  logger.info("[CRON] Running GitHub auto-sync for all linked repos...");
  try {
    const activeGroups = await Group.find({
      status: "active",
      "github.repoUrl": { $exists: true, $ne: null },
    }).select("_id name github.repoUrl");

    let synced = 0;
    let failed = 0;
    for (const group of activeGroups) {
      try {
        await syncAllGithubData(group._id);
        synced++;
      } catch (err) {
        console.warn(`[CRON] GitHub sync failed for group ${group.name}: ${err.message}`);
        failed++;
      }
    }
    logger.info(`[CRON] GitHub sync complete. Synced: ${synced}, Failed: ${failed}.`);
  } catch (err) {
    logger.error("[CRON] GitHub auto-sync error:", err.message);
  }
};

const initCronJobs = () => {
  // Run daily at 8:00 AM for reminders and inactivity checks
  cron.schedule("0 8 * * *", async () => {
    await runTaskReminders();
    await runDeadlineReminders();
    await runProactiveInactivityCheck();
  });

  // Run weekly on Mondays at 9:00 AM for AI Audit
  cron.schedule("0 9 * * 1", async () => {
    await runAutonomousAudit();
  });

  // Run every hour to sync GitHub stats for linked repos
  cron.schedule("0 * * * *", async () => {
    await runGithubAutoSync();
  });

  logger.info(
    "[CRON] Scheduled jobs initialized (Reminders daily, AI Audit weekly, GitHub sync hourly).",
  );
};

export { runAutonomousAudit, initCronJobs };
