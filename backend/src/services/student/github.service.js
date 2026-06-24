import Group from "../../models/group.model.js";
import ApiError from "../../utils/apiError.js";
import { logger } from '../../utils/logger.js';


// Extracts "owner/repo" from a standard github URL like "https://github.com/owner/repo"
const extractRepoPath = (url) => {
  if (!url) return null;
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return `${match[1]}/${match[2].replace('.git', '')}`;
};

// Get ISO-week string from a Date, e.g. "2026-W16"
const getWeekString = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
};

export const linkGithubRepo = async (groupId, leaderId, repoUrl) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (String(group.leader) !== String(leaderId)) {
    throw new ApiError(403, "Only the group leader can link a GitHub repository");
  }

  const repoPath = extractRepoPath(repoUrl);
  if (!repoPath) {
    throw new ApiError(400, "Invalid GitHub repository URL. Must be in format: https://github.com/owner/repo");
  }

  if (!group.github) {
    group.github = {};
  }

  group.github.repoUrl = repoUrl;
  await group.save();

  return group;
};

export const unlinkGithubRepo = async (groupId, leaderId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new ApiError(404, "Group not found");

  if (String(group.leader) !== String(leaderId)) {
    throw new ApiError(403, "Only the group leader can unlink a GitHub repository");
  }

  group.github = {
    repoUrl: null,
    lastSync: null,
    commits: [],
    recentCommits: [],
    weeklyActivity: [],
    dailyActivity: [],
    totalCommits: 0,
  };
  await group.save();

  return group;
};

const fetchGithubData = async (repoPath, endpoint) => {
  const apiHeaders = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "FYPMS-App",
  };

  const response = await fetch(`https://api.github.com/repos/${repoPath}/${endpoint}`, {
    headers: apiHeaders,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(404, "Repository not found or is private. Only public repos are supported.");
    }
    if (response.status === 403) {
      throw new ApiError(429, "GitHub API rate limit exceeded. Try again later.");
    }
    throw new ApiError(500, `GitHub API responded with status ${response.status}`);
  }

  return await response.json();
};

export const syncGithubCommits = async (group) => {
  const repoPath = extractRepoPath(group.github.repoUrl);
  if (!repoPath) throw new ApiError(400, "Invalid repository path");

  const rawCommits = await fetchGithubData(repoPath, "commits?per_page=100");

  // Per-author aggregation
  const commitMap = new Map();
  rawCommits.forEach((c) => {
    const commit = c.commit;
    if (!commit || !commit.author) return;

    const email = commit.author.email.toLowerCase();
    const name = commit.author.name;

    if (!commitMap.has(email)) {
      commitMap.set(email, { authorEmail: email, authorName: name, count: 0 });
    }
    commitMap.get(email).count += 1;
  });

  // Recent commits feed
  const recentCommits = rawCommits.slice(0, 20).map((c) => ({
    sha: c.sha?.substring(0, 7) || "",
    message: (c.commit?.message || "").split("\n")[0].substring(0, 120),
    authorName: c.commit?.author?.name || "Unknown",
    authorEmail: (c.commit?.author?.email || "").toLowerCase(),
    date: c.commit?.author?.date || null,
  }));

  // Weekly activity
  const weekMap = new Map();
  rawCommits.forEach((c) => {
    const dateStr = c.commit?.author?.date;
    if (dateStr) {
      const week = getWeekString(dateStr);
      weekMap.set(week, (weekMap.get(week) || 0) + 1);
    }
  });

  const weeklyActivity = Array.from(weekMap.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12);

  group.github.commits = Array.from(commitMap.values());
  group.github.recentCommits = recentCommits;
  group.github.weeklyActivity = weeklyActivity;
  group.github.totalCommits = rawCommits.length;

  return group;
};

export const syncGithubPrs = async (group) => {
  const repoPath = extractRepoPath(group.github.repoUrl);
  const rawPrs = await fetchGithubData(repoPath, "pulls?state=all&per_page=50");

  group.github.pullRequests = rawPrs.map(pr => ({
    githubId: pr.id,
    number: pr.number,
    title: pr.title,
    state: pr.state,
    author: pr.user?.login,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    url: pr.html_url
  }));

  group.github.stats.mergedPRs = rawPrs.filter(pr => pr.merged_at).length;
  group.github.stats.openPRs = rawPrs.filter(pr => pr.state === "open").length;

  return group;
};

export const syncGithubIssues = async (group) => {
  const repoPath = extractRepoPath(group.github.repoUrl);
  const rawIssues = await fetchGithubData(repoPath, "issues?state=all&per_page=50");

  // GitHub API returns PRs in the issues endpoint. Filter them out.
  const issuesOnly = rawIssues.filter(item => !item.pull_request);

  group.github.issues = issuesOnly.map(issue => ({
    githubId: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    author: issue.user?.login,
    createdAt: issue.created_at,
    closedAt: issue.closed_at,
    url: issue.html_url
  }));

  group.github.stats.closedIssues = issuesOnly.filter(i => i.state === "closed").length;
  group.github.stats.openIssues = issuesOnly.filter(i => i.state === "open").length;

  return group;
};

export const syncAllGithubData = async (groupId) => {
  let group = await Group.findById(groupId);
  if (!group || !group.github?.repoUrl) return null;

  try {
    group = await syncGithubCommits(group);
    group = await syncGithubPrs(group);
    group = await syncGithubIssues(group);
    
    group.github.lastSync = new Date();
    await group.save();
    return group.github;
  } catch (error) {
    logger.error(`Sync failed for group ${groupId}:`, error.message);
    throw error;
  }
};
