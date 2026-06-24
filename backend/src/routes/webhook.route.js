import express from "express";
import crypto from "crypto";
import Group from "../models/group.model.js";
import { syncAllGithubData } from "../services/student/github.service.js";
import { createNotification } from "../services/notification.service.js";
import { logger } from '../utils/logger.js';


const router = express.Router();

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

// Verify GitHub webhook HMAC-SHA256 signature
const verifySignature = (req) => {
  if (!GITHUB_WEBHOOK_SECRET) return true; // Skip if no secret configured
  const sig = req.headers["x-hub-signature-256"];
  if (!sig) return false;
  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  hmac.update(JSON.stringify(req.body));
  const digest = `sha256=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest));
};

// POST /api/webhooks/github
router.post("/github", express.json(), async (req, res) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const event = req.headers["x-github-event"];
    const payload = req.body;

    // Extract repo URL from payload
    const repoHtmlUrl = payload.repository?.html_url;
    if (!repoHtmlUrl) return res.status(200).json({ message: "No repo info" });

    // Find the group with this repo linked
    const group = await Group.findOne({ "github.repoUrl": { $regex: repoHtmlUrl.replace("https://github.com/", ""), $options: "i" } })
      .populate("members.user", "_id")
      .populate("supervisor", "_id");

    if (!group) {
      return res.status(200).json({ message: "No matching group found." });
    }

    // Trigger a full sync
    await syncAllGithubData(group._id);

    // Dispatch notifications based on event type
    const allRecipients = [
      ...(group.members?.map((m) => m.user?._id) || []),
      group.supervisor?._id,
    ].filter(Boolean);

    let title = "";
    let message = "";

    if (event === "push") {
      const branch = payload.ref?.replace("refs/heads/", "") || "main";
      const commits = payload.commits?.length || 0;
      title = `New Push to ${branch}`;
      message = `${commits} commit(s) pushed to "${group.name}" repository.`;
    } else if (event === "pull_request") {
      const action = payload.action;
      const prTitle = payload.pull_request?.title;
      title = `Pull Request ${action}`;
      message = `PR "${prTitle}" was ${action} in "${group.name}".`;
    } else if (event === "issues") {
      const action = payload.action;
      const issueTitle = payload.issue?.title;
      title = `Issue ${action}`;
      message = `Issue "${issueTitle}" was ${action} in "${group.name}".`;
    } else {
      return res.status(200).json({ message: `Event "${event}" acknowledged but not handled.` });
    }

    for (const userId of allRecipients) {
      await createNotification({
        user: userId,
        title,
        message,
        type: "update",
        link: `/student/groups`,
      });
    }

    return res.status(200).json({ message: "Webhook processed.", event });
  } catch (err) {
    logger.error("[WEBHOOK] GitHub webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
