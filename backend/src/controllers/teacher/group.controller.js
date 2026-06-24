import asyncHandler from "../../utils/asyncHandler.js";
import * as teacherGroupService from "../../services/teacher/group.service.js";
import Group from "../../models/group.model.js";
import { createNotification } from "../../services/notification.service.js";
import { sendEmail } from "../../services/email.service.js";
import config from "../../config/env.js";

const universityName = config.universityName || "University";

const buildSupervisorWarning = (groupName, supervisorName, issues = []) => {
  const issueLines = issues.map((issue) => `• ${issue}`).join("\n");
  const issueLinesHtml = issues.map((issue) => `<li style="margin-bottom:6px;">${issue}</li>`).join("");

  const title = `⚠️ Supervisor Warning: ${groupName}`;
  const text = [
    `Hello Team,`,
    ``,
    `Your supervisor, ${supervisorName}, has flagged your group "${groupName}" as at-risk due to the following issues:`,
    ``,
    issueLines,
    ``,
    `Please address these issues immediately and schedule a meeting with your supervisor.`,
    ``,
    `${universityName}`,
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,0.12);">
              <tr>
                <td style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:28px 32px;">
                  <div style="color:#ffffff;font-size:20px;font-weight:700;">Supervisor Warning</div>
                  <div style="color:#fde68a;font-size:13px;margin-top:6px;">Action Required</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <div style="font-size:18px;color:#0f172a;font-weight:700;margin-bottom:10px;">Dear Members of ${groupName},</div>
                  <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:18px;">
                    Your supervisor, <strong>${supervisorName}</strong>, has flagged your group as <strong style="color:#ea580c;">at-risk</strong>. Please review the following issues and take immediate action.
                  </div>
                  <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin-bottom:18px;">
                    <div style="font-size:12px;color:#b45309;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:700;">Issues Identified</div>
                    <ul style="margin:0;padding-left:18px;font-size:14px;color:#92400e;line-height:1.8;">
                      ${issueLinesHtml}
                    </ul>
                  </div>
                  <div style="font-size:13px;color:#64748b;">Please resolve these issues and communicate with your supervisor as soon as possible.</div>
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

const getMyAssignedGroups = asyncHandler(async (req, res) => {
  const groups = await teacherGroupService.getAssignedGroups(req.user._id);
  res.json({ message: "Assigned groups fetched successfully", groups });
});

const getMyAtRiskGroups = asyncHandler(async (req, res) => {
  const atRisk = await teacherGroupService.getAtRiskGroups(req.user._id);
  res.status(200).json({
    success: true,
    data: atRisk,
  });
});

const warnGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { issues = [] } = req.body;
  const teacherId = req.user._id;

  // Ensure this teacher supervises the group
  const group = await Group.findOne({ _id: groupId, supervisor: teacherId }).populate({
    path: "members.user",
    select: "name email",
  });

  if (!group) {
    return res.status(404).json({ success: false, message: "Group not found or not assigned to you." });
  }

  const members = (group.members || []).map((m) => m.user).filter(Boolean);

  if (members.length === 0) {
    return res.status(200).json({ success: true, message: "No members to notify." });
  }

  const emailTemplate = buildSupervisorWarning(group.name, req.user.name, issues);
  const issuesSummary = issues.length > 0 ? issues.join("; ") : "Your group has been flagged as at-risk by your supervisor.";

  await Promise.all(
    members.map(async (user) => {
      // In-app notification
      await createNotification({
        user: user._id,
        title: `⚠️ Supervisor Warning: ${group.name}`,
        message: `Message from ${req.user.name}: ${issuesSummary}`,
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
  });
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const data = await teacherGroupService.getGroupDetails(
    req.user._id,
    req.params.groupId,
  );
  res.json({ message: "Group details fetched successfully", data });
});

const getGroupWorkspace = asyncHandler(async (req, res) => {
  const data = await teacherGroupService.getGroupWorkspace(
    req.user._id,
    req.params.groupId,
  );
  res.json({ message: "Group workspace fetched successfully", data });
});

export { getMyAssignedGroups, getMyAtRiskGroups, warnGroup, getGroupDetails, getGroupWorkspace };
