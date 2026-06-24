import Group from "../../models/group.model.js";
import Project from "../../models/project.model.js";
import Task from "../../models/task.model.js";
import Feature from "../../models/feature.model.js";
import File from "../../models/file.model.js";
import MeetingLog from "../../models/meetingLog.model.js";
import Deadline from "../../models/deadline.model.js";
import ApiError from "../../utils/apiError.js";

const getAssignedGroups = async (teacherId) => {
  const groups = await Group.find({ supervisor: teacherId })
    .populate("leader", "name email")
    .populate("members.user", "name email")
    .populate("project", "title status");
  return groups;
};

const getGroupDetails = async (teacherId, groupId) => {
  const group = await Group.findOne({ _id: groupId, supervisor: teacherId })
    .populate("leader", "name email")
    .populate("members.user", "name email");

  if (!group) throw new ApiError(404, "Group not found or not assigned to you");

  const project = await Project.findOne({ group: groupId });

  return { group, project };
};

const getGroupWorkspace = async (teacherId, groupId) => {
  const group = await Group.findOne({ _id: groupId, supervisor: teacherId })
    .populate("leader", "name email")
    .populate("members.user", "name email");

  if (!group) throw new ApiError(404, "Group not found or not assigned to you");

  const [project, tasks, rawFeatures, resources, meetings] = await Promise.all([
    Project.findOne({ group: groupId }),
    Task.find({ group: groupId })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("linkedResources", "originalName fileUrl uploadedBy createdAt")
      .lean(),
    Feature.find({ group: groupId })
      .populate("implementedBy", "name email")
      .populate({
        path: "relatedTasks",
        populate: [
          { path: "createdBy", select: "name email" },
          { path: "assignedTo", select: "name email" },
          {
            path: "linkedResources",
            select: "originalName fileUrl uploadedBy createdAt",
          },
        ],
      })
      .lean(),
    File.find({ category: "group_resource", relatedEntity: groupId })
      .populate("uploadedBy", "name email role")
      .populate("metadata.linkedTasks", "title status assignedTo createdBy")
      .lean(),
    MeetingLog.find({ group: groupId }).lean(),
  ]);

  const resourcesById = new Map(resources.map((resource) => [String(resource._id), resource]));

  const features = rawFeatures.map((feature) => {
    const relatedTasks = feature.relatedTasks || [];

    const contributorsMap = new Map();
    const resourceIds = new Set();
    let completedTasks = 0;

    relatedTasks.forEach((task) => {
      if (task?.status === "completed") completedTasks += 1;

      const owner = task.assignedTo || task.createdBy;
      if (owner?._id) {
        contributorsMap.set(String(owner._id), {
          _id: owner._id,
          name: owner.name,
          email: owner.email,
        });
      }

      (task.linkedResources || []).forEach((resource) => {
        if (resource?._id) resourceIds.add(String(resource._id));
      });
    });

    const featureResources = [...resourceIds]
      .map((id) => resourcesById.get(id))
      .filter(Boolean);

    return {
      ...feature,
      contributors: [...contributorsMap.values()],
      resourceCount: featureResources.length,
      resources: featureResources,
      progress:
        relatedTasks.length > 0
          ? Math.round((completedTasks / relatedTasks.length) * 100)
          : 0,
    };
  });

  // --- Contribution Tracking ---
  const memberStats = new Map();
  
  // Initialize map with all members + leader
  if (group.leader) {
    memberStats.set(String(group.leader._id), {
       user: group.leader,
       tasksCreated: 0,
       tasksAssigned: 0,
       tasksCompleted: 0,
       resourcesUploaded: 0,
       featuresImplemented: 0,
       meetingsAttended: 0,
       score: 0,
    });
  }
  (group.members || []).forEach(m => {
    if (m.user && m.user._id) {
      memberStats.set(String(m.user._id), {
         user: m.user,
         tasksCreated: 0,
         tasksAssigned: 0,
         tasksCompleted: 0,
         resourcesUploaded: 0,
         featuresImplemented: 0,
         meetingsAttended: 0,
         githubCommits: 0,
         score: 0,
      });
    }
  });

  const githubCommitsArray = group.github?.commits || [];
  githubCommitsArray.forEach(commitData => {
    // Attempt to map commit to active member by email
    const member = group.members.find(m => m.user && m.user.email && m.user.email.toLowerCase() === commitData.authorEmail.toLowerCase());
    if (member && memberStats.has(String(member.user._id))) {
      const stats = memberStats.get(String(member.user._id));
      stats.githubCommits += commitData.count;
      stats.score += commitData.count * 2; // give 2 points per commit
    } else if (group.leader && group.leader.email && group.leader.email.toLowerCase() === commitData.authorEmail.toLowerCase()) {
      const stats = memberStats.get(String(group.leader._id));
      stats.githubCommits += commitData.count;
      stats.score += commitData.count * 2;
    }
  });

  tasks.forEach(task => {
    if (task.createdBy && memberStats.has(String(task.createdBy._id))) {
       memberStats.get(String(task.createdBy._id)).tasksCreated += 1;
    }
    if (task.assignedTo && memberStats.has(String(task.assignedTo._id))) {
       const stats = memberStats.get(String(task.assignedTo._id));
       stats.tasksAssigned += 1;
       if (task.status === "completed") {
         stats.tasksCompleted += 1;
         stats.score += 10;
       }
    }
  });

  resources.forEach(res => {
    if (res.uploadedBy && memberStats.has(String(res.uploadedBy._id))) {
      const stats = memberStats.get(String(res.uploadedBy._id));
      stats.resourcesUploaded += 1;
      stats.score += 5;
    }
  });

  features.forEach(feat => {
    if (feat.implementedBy && memberStats.has(String(feat.implementedBy._id))) {
      const stats = memberStats.get(String(feat.implementedBy._id));
      stats.featuresImplemented += 1;
      stats.score += 15;
    }
  });

  meetings.forEach(meeting => {
    (meeting.attendees || []).forEach(attendeeId => {
      if (memberStats.has(String(attendeeId))) {
        const stats = memberStats.get(String(attendeeId));
        stats.meetingsAttended += 1;
        stats.score += 2; // 2 points per meeting
      }
    });
  });

  const rawContributions = [...memberStats.values()];
  const totalScore = rawContributions.reduce((sum, m) => sum + m.score, 0);

  const contributions = rawContributions.map(m => ({
    user: m.user,
    metrics: {
      tasksCreated: m.tasksCreated,
      tasksAssigned: m.tasksAssigned,
      tasksCompleted: m.tasksCompleted,
      resourcesUploaded: m.resourcesUploaded,
      featuresImplemented: m.featuresImplemented,
      meetingsAttended: m.meetingsAttended,
      githubCommits: m.githubCommits,
    },
    percentage: totalScore > 0 ? Math.round((m.score / totalScore) * 100) : 0
  }));

  return {
    group,
    project,
    tasks,
    resources,
    features,
    contributions,
  };
};

const getAtRiskGroups = async (teacherId) => {
  const activeGroups = await Group.find({ status: "active", supervisor: teacherId })
    .populate("project", "status title deadline")
    .lean();

  const riskReports = await Promise.all(
    activeGroups.map(async (group) => {
      const issues = [];
      let severity = "low"; // 'low', 'medium', 'high'

      // 1. Check Project
      if (!group.project) {
        issues.push("No project proposal submitted");
        severity = severity === "high" ? "high" : "medium";
      } else if (group.project.status === "rejected") {
        issues.push("Project proposal rejected");
        severity = severity === "high" ? "high" : "medium";
      }

      // 2. Task Activity
      const tasks = await Task.find({ group: group._id }).lean();
      if (tasks.length === 0) {
        issues.push("No tasks created");
        severity = severity === "high" ? "high" : "medium";
      } else {
        const now = new Date();
        const overdueTasks = tasks.filter(
          (t) =>
            t.deadline &&
            new Date(t.deadline) < now &&
            t.status !== "completed",
        );
        if (overdueTasks.length > 0) {
          issues.push(`${overdueTasks.length} overdue task(s)`);
          severity =
            overdueTasks.length >= 3
              ? "high"
              : severity === "high"
                ? "high"
                : "medium";
        }
      }

      // 3. Project Deadlines & Intelligence
      if (group.project) {
        const deadlines = await Deadline.find({
          project: group.project._id,
        }).populate("linkedFeature", "status").lean();
        
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        let hasOverdueDeadline = false;
        let impendingPendingDeadlines = 0;

        deadlines.forEach((d) => {
          // Check for actual overdue completion status or time-based overdue if no feature linked
          const isOverdue = d.completionStatus === "overdue" || (d.dueDate && new Date(d.dueDate) < now && d.completionStatus !== "completed_early" && d.completionStatus !== "completed_on_time");
          
          if (isOverdue) {
            hasOverdueDeadline = true;
          }

          // Check for impending deadlines (<7 days) with pending linked feature
          if (d.dueDate && new Date(d.dueDate) > now && new Date(d.dueDate) < sevenDaysFromNow) {
            if (d.linkedFeature && d.linkedFeature.status === "pending") {
              impendingPendingDeadlines++;
            }
          }
        });

        if (hasOverdueDeadline) {
          issues.push(`One or more project deadlines are overdue`);
          severity = "high";
        }
        if (impendingPendingDeadlines > 0) {
          issues.push(`${impendingPendingDeadlines} impending deadline(s) (<7 days) with 0 progress`);
          severity = severity === "high" ? "high" : "medium";
        }
      }

      // 4. Inactivity (14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      
      const recentTasksCount = await Task.countDocuments({
        group: group._id,
        status: "completed",
        updatedAt: { $gte: fourteenDaysAgo },
      });

      let recentCommits = 0;
      if (group.github && group.github.commits) {
        group.github.commits.forEach((c) => {
          if (new Date(c.date) >= fourteenDaysAgo) {
            recentCommits += c.count;
          }
        });
      }

      if (recentTasksCount === 0 && recentCommits === 0) {
        issues.push("Total inactivity: No tasks completed or GitHub commits in the last 14 days");
        severity = severity === "high" ? "high" : "medium";
      }

      // 4. Meetings Activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentMeetingsCount = await MeetingLog.countDocuments({
        group: group._id,
        date: { $gte: thirtyDaysAgo },
      });

      if (recentMeetingsCount === 0) {
        issues.push("No meetings in the last 30 days");
      }

      return {
        groupId: group._id,
        groupName: group.name,
        department: group.department,
        semester: group.semester,
        severity,
        issues,
      };
    }),
  );

  const severityValue = { high: 3, medium: 2, low: 1 };

  return riskReports
    .filter((r) => r.issues.length > 0)
    .sort((a, b) => severityValue[b.severity] - severityValue[a.severity]);
};

export { getAssignedGroups, getAtRiskGroups, getGroupDetails, getGroupWorkspace };
