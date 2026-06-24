import api from "../../../services/api/client.js";

const fetchMyGroup = async () => {
  const { data } = await api.get("/api/student/groups/my-group");
  return data;
};

const fetchInvites = async () => {
  const { data } = await api.get("/api/student/groups/invites");
  return data;
};

const fetchJoinRequests = async () => {
  const { data } = await api.get("/api/student/groups/join-requests");
  return data;
};

const fetchRelatedGroups = async () => {
  const { data } = await api.get("/api/student/groups");
  return data;
};

const fetchRelatedStudents = async () => {
  const { data } = await api.get("/api/student/groups/students");
  return data;
};

const fetchAvailableSupervisors = async () => {
  const { data } = await api.get("/api/student/groups/supervisors/available");
  console.log(data);
  return data;
};

const fetchMySupervisorRequest = async () => {
  const { data } = await api.get("/api/student/groups/supervisor-request");
  return data;
};

const createSupervisorRequest = async ({ supervisorId, note }) => {
  const { data } = await api.post("/api/student/groups/supervisor-request", {
    supervisorId,
    note,
  });
  return data;
};

const cancelSupervisorRequest = async (requestId) => {
  const { data } = await api.delete(
    `/api/student/groups/supervisor-request/${requestId}`,
  );
  return data;
};

const createGroup = async (payload) => {
  const { data } = await api.post("/api/student/groups", payload);
  return data;
};

const requestJoinGroup = async (groupId) => {
  const { data } = await api.post("/api/student/groups/join", { groupId });
  return data;
};

const respondInvite = async ({ inviteId, accept }) => {
  const { data } = await api.post(`/api/student/groups/invites/${inviteId}`, {
    accept,
  });
  return data;
};

const respondJoinRequest = async ({ requestId, accept }) => {
  const { data } = await api.post(`/api/student/groups/join/${requestId}`, {
    accept,
  });
  return data;
};

const inviteStudent = async (receiverId) => {
  const { data } = await api.post("/api/student/groups/invite", { receiverId });
  return data;
};

const submitGroupForApproval = async () => {
  const { data } = await api.post("/api/student/groups/submit");
  console.log(data);
  return data;
};

const leaveGroup = async () => {
  const { data } = await api.post("/api/student/groups/leave");
  return data;
};

const removeMember = async (userId) => {
  const { data } = await api.delete(`/api/student/groups/members/${userId}`);
  return data;
};

const transferLeadership = async (newLeaderId) => {
  const { data } = await api.patch("/api/student/groups/transfer-leadership", {
    newLeaderId,
  });
  return data;
};

const deleteGroup = async () => {
  const { data } = await api.delete("/api/student/groups/delete");
  return data;
};

const fetchTasks = async () => {
  const { data } = await api.get("/api/student/tasks");
  return data;
};

const createTask = async (payload) => {
  const { data } = await api.post("/api/student/tasks", payload);
  return data;
};

const updateTask = async (taskId, payload) => {
  const { data } = await api.put(`/api/student/tasks/${taskId}`, payload);
  return data;
};

const deleteTask = async (taskId) => {
  const { data } = await api.delete(`/api/student/tasks/${taskId}`);
  return data;
};

const fetchFeatures = async () => {
  const { data } = await api.get("/api/student/features");
  return data;
};

const createFeature = async (payload) => {
  const { data } = await api.post("/api/student/features", payload);
  return data;
};

const updateFeature = async (featureId, payload) => {
  const { data } = await api.put(`/api/student/features/${featureId}`, payload);
  return data;
};

const attachTaskToFeature = async (featureId, taskId) => {
  const { data } = await api.post(
    `/api/student/features/${featureId}/tasks/${taskId}`,
  );
  return data;
};

const detachTaskFromFeature = async (featureId, taskId) => {
  const { data } = await api.delete(
    `/api/student/features/${featureId}/tasks/${taskId}`,
  );
  return data;
};

const deleteFeature = async (featureId) => {
  const { data } = await api.delete(`/api/student/features/${featureId}`);
  return data;
};

const fetchProject = async () => {
  const { data } = await api.get("/api/student/projects/my");
  return data;
};

const submitProjectProposal = async ({ title, description, files = [] }) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  files.forEach((file) => {
    formData.append("files", file);
  });

  const { data } = await api.post("/api/student/projects/submit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const deleteMyProject = async () => {
  const { data } = await api.delete("/api/student/projects/my");
  return data;
};

const fetchProjectFeedback = async (projectId) => {
  const { data } = await api.get(`/api/student/projects/${projectId}/feedback`);
  return data;
};

const fetchDeadlines = async () => {
  const { data } = await api.get("/api/student/deadlines");
  return data;
};

const fetchResources = async () => {
  const { data } = await api.get("/api/student/resources");
  return data;
};

const uploadResource = async (
  file,
  description,
  resourceName,
  linkedTaskIds = [],
) => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);
  if (resourceName) formData.append("resourceName", resourceName);
  if (Array.isArray(linkedTaskIds) && linkedTaskIds.length > 0) {
    formData.append("linkedTaskIds", JSON.stringify(linkedTaskIds));
  }

  const { data } = await api.post("/api/student/resources/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const setTaskResources = async (taskId, resourceIds = []) => {
  const { data } = await api.patch(
    "/api/student/tasks/" + taskId + "/resources",
    {
      resourceIds,
    },
  );
  return data;
};

const deleteResource = async (fileId) => {
  const { data } = await api.delete(`/api/student/resources/${fileId}`);
  return data;
};

const fetchMeetings = async () => {
  const { data } = await api.get("/api/student/meetings");
  return data;
};

const createMeeting = async (payload) => {
  const { data } = await api.post("/api/student/meetings", payload);
  return data;
};

const markMeetingAttendance = async (meetingId, attendees) => {
  const { data } = await api.patch(
    `/api/student/meetings/${meetingId}/attendance`,
    { attendees },
  );
  return data;
};

const fetchPendingAttendanceMeetings = async () => {
  const { data } = await api.get("/api/student/meetings/pending-attendance");
  return data;
};

const fetchNotifications = async () => {
  const { data } = await api.get("/api/notifications");
  return data;
};

const updateMeeting = async (meetingId, payload) => {
  const { data } = await api.put(`/api/student/meetings/${meetingId}`, payload);
  return data;
};

const deleteMeeting = async (meetingId) => {
  const { data } = await api.delete(`/api/student/meetings/${meetingId}`);
  return data;
};

// -- GitHub Integration ------------------------------------------------------
const linkGithubRepo = async (repoUrl) => {
  const { data } = await api.post("/api/student/groups/github/link", {
    repoUrl,
  });
  return data;
};

const syncGithubCommits = async () => {
  const { data } = await api.post("/api/student/groups/github/sync");
  return data;
};

const unlinkGithubRepo = async () => {
  const { data } = await api.delete("/api/student/groups/github/unlink");
  return data;
};

const fetchEvaluation = async (projectId) => {
  const { data } = await api.get(
    `/api/student/projects/${projectId}/evaluation`,
  );
  return data;
};

// -- AI Integration ----------------------------------------------------------
const generateAITaskBreakdown = async (featureDescription, taskCount) => {
  const { data } = await api.post("/api/student/ai/tasks/breakdown", {
    featureDescription,
    taskCount,
  });
  return data;
};

const generateAIMeetingSummary = async (discussionPoints, agenda, date) => {
  const { data } = await api.post("/api/student/ai/meetings/summarize", {
    discussionPoints,
    agenda,
    date,
  });
  return data;
};

const fetchPrioritizedTasks = async () => {
  const { data } = await api.get("/api/student/ai/tasks/prioritize");
  return data;
};

const fetchTeamBalance = async () => {
  const { data } = await api.get("/api/student/ai/team-balance");
  return data;
};

export default {
  fetchMyGroup,
  fetchInvites,
  fetchJoinRequests,
  fetchRelatedGroups,
  fetchRelatedStudents,
  fetchAvailableSupervisors,
  fetchMySupervisorRequest,
  createSupervisorRequest,
  cancelSupervisorRequest,
  createGroup,
  requestJoinGroup,
  respondInvite,
  respondJoinRequest,
  inviteStudent,
  submitGroupForApproval,
  leaveGroup,
  removeMember,
  transferLeadership,
  deleteGroup,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  fetchFeatures,
  createFeature,
  updateFeature,
  attachTaskToFeature,
  detachTaskFromFeature,
  deleteFeature,
  fetchProject,
  submitProjectProposal,
  deleteMyProject,
  fetchProjectFeedback,
  fetchDeadlines,
  fetchResources,
  uploadResource,
  setTaskResources,
  deleteResource,
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  fetchNotifications,
  markMeetingAttendance,
  fetchPendingAttendanceMeetings,
  linkGithubRepo,
  syncGithubCommits,
  unlinkGithubRepo,
  fetchEvaluation,
  generateAITaskBreakdown,
  generateAIMeetingSummary,
  fetchPrioritizedTasks,
  fetchTeamBalance,
  fetchProjectEvidence: (projectId) =>
    api.get(`/api/student/projects/${projectId}/evidence`).then((r) => r.data),
  submitProjectEvidence: (projectId, payload) => {
    if (payload.file) {
      const formData = new FormData();
      formData.append("criterionKey", payload.criterionKey);
      formData.append("file", payload.file);
      if (payload.value) formData.append("value", payload.value);
      return api
        .post(`/api/student/projects/${projectId}/evidence`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    }
    return api
      .post(`/api/student/projects/${projectId}/evidence`, payload)
      .then((r) => r.data);
  },
  fetchProjectMilestones: (projectId) =>
    api
      .get(`/api/student/projects/${projectId}/milestones`)
      .then((r) => r.data),
  fetchRubricCriteria: () =>
    api.get("/api/student/projects/rubric-criteria").then((r) => r.data),
  apiClient: api,
};
