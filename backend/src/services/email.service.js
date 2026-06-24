import config from "../config/env.js";
import { createTransporter } from "../config/mailer.js";

// Lazy transport creation based on SMTP env availability.
const transporter = createTransporter();
const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) return;

  await transporter.sendMail({
    from: config.mailFrom,
    to,
    subject,
    text,
    html,
  });
};

const buildTeacherWelcomeEmail = ({ teacherName, teacherEmail, password }) => {
  const universityName = config.universityName || "University";
  const subject = `Welcome to ${universityName} Project Management System`;
  const safeTeacherName = teacherName || "Teacher";
  const safeAdminName = config.adminName;

  const text = [
    `Hello ${safeTeacherName},`,
    "",
    `You have been added to the ${universityName} Project Management System by ${safeAdminName}.`,
    "Use the credentials below to sign in:",
    `Email: ${teacherEmail}`,
    `Password: ${password}`,
    "",
    "Please change your password after your first login.",
    "",
    `${universityName}`,
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background-color:#f4f6fb;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,0.12);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,#2563eb);padding:28px 32px;">
                  <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.4px;">
                    ${universityName} Project Management System
                  </div>
                  <div style="color:#cbd5f5;font-size:13px;margin-top:6px;">
                    Teacher Account Created
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <div style="font-size:18px;color:#0f172a;font-weight:700;margin-bottom:10px;">
                    Welcome, ${safeTeacherName}
                  </div>
                  <div style="font-size:14px;color:#475569;line-height:1.6;margin-bottom:18px;">
                    You have been added to the project management system by <strong>${safeAdminName}</strong>.
                    Please use the credentials below to sign in.
                  </div>
                  <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:18px;">
                    <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                      Login Credentials
                    </div>
                    <div style="font-size:14px;color:#0f172a;line-height:1.8;">
                      <div><strong>Email:</strong> ${teacherEmail}</div>
                      <div><strong>Password:</strong> ${password}</div>
                    </div>
                  </div>
                  <div style="font-size:13px;color:#64748b;line-height:1.6;">
                    For security, please change your password after your first login.
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 32px;background-color:#f1f5f9;color:#64748b;font-size:12px;">
                  This message was sent by ${universityName}.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { subject, text, html };
};

export { sendEmail, buildTeacherWelcomeEmail };
