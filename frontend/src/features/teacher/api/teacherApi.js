import api from "../../../services/api/client.js";

const fetchAssignedGroups = async () => {
  const { data } = await api.get("/api/teacher/groups/assigned");
  return data;
};

const fetchGroupDetails = async (groupId) => {
  const { data } = await api.get(`/api/teacher/groups/assigned/${groupId}`);
  return data;
};

const fetchGroupWorkspace = async (groupId) => {
  const { data } = await api.get(`/api/teacher/groups/assigned/${groupId}/workspace`);
  return data;
};

const fetchProjectProposals = async (status = "submitted") => {
  const query = status ? `?status=${status}` : "";
  const { data } = await api.get(`/api/teacher/projects${query}`);
  return data;
};

const approveProject = async (projectId, feedbackMessage) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/approve`, {
    feedbackMessage,
  });
  return data;
};

const rejectProject = async (projectId, feedbackMessage) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/reject`, {
    feedbackMessage,
  });
  return data;
};

const fetchProjectFeedback = async (projectId) => {
  const { data } = await api.get(`/api/teacher/projects/${projectId}/feedback`);
  return data;
};

const addProjectFeedback = async (projectId, payload) => {
  const formData = new FormData();
  if (payload.type) formData.append("type", payload.type);
  if (payload.title) formData.append("title", payload.title);
  if (payload.message) formData.append("message", payload.message);
  if (payload.priority) formData.append("priority", payload.priority);
  if (Array.isArray(payload.featureIds) && payload.featureIds.length > 0) {
    formData.append("featureIds", JSON.stringify(payload.featureIds));
  }
  (payload.files || []).forEach((file) => formData.append("files", file));

  const { data } = await api.post(`/api/teacher/projects/${projectId}/feedback`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const fetchGroupMeetings = async (groupId) => {
  const { data } = await api.get(`/api/teacher/meetings/groups/${groupId}`);
  return data;
};

const createGroupMeeting = async (groupId, payload) => {
  const { data } = await api.post(`/api/teacher/meetings/groups/${groupId}`, payload);
  return data;
};

const deleteMeetingLog = async (logId) => {
  const { data } = await api.delete(`/api/teacher/meetings/${logId}`);
  return data;
};

const markMeetingAttendance = async (logId, attendeeIds) => {
  const { data } = await api.patch(`/api/teacher/meetings/${logId}/attendance`, { attendeeIds });
  return data;
};

const fetchPendingAttendanceMeetings = async () => {
  const { data } = await api.get("/api/teacher/meetings/pending-attendance");
  return data;
};

const fetchProjectDeadlines = async (projectId) => {
  const { data } = await api.get(`/api/teacher/deadlines/projects/${projectId}`);
  return data;
};

const createProjectDeadline = async (projectId, payload) => {
  const { data } = await api.post(`/api/teacher/deadlines/projects/${projectId}`, payload);
  return data;
};

const deleteDeadline = async (deadlineId) => {
  const { data } = await api.delete(`/api/teacher/deadlines/${deadlineId}`);
  return data;
};

const overrideDeadlineStatus = async (deadlineId, payload) => {
  const { data } = await api.patch(`/api/teacher/deadlines/${deadlineId}/override`, payload);
  return data;
};

const fetchGroupResources = async (groupId) => {
  const { data } = await api.get(`/api/teacher/resources/groups/${groupId}`);
  return data;
};

const fetchAtRiskGroups = async () => {
  const { data } = await api.get("/api/teacher/groups/at-risk");
  return data;
};

const warnGroup = async (groupId, issues = []) => {
  const { data } = await api.post(`/api/teacher/groups/${groupId}/warn`, { issues });
  return data;
};

// --- Evaluation & Completion -------------------------------------------------

const fetchCompletionMetrics = async (projectId) => {
  const { data } = await api.get(`/api/teacher/projects/${projectId}/completion-metrics`);
  return data;
};

const fetchSuggestedGrades = async (projectId) => {
  const { data } = await api.get(`/api/teacher/projects/${projectId}/evaluation/suggest`);
  return data;
};

const saveEvaluation = async (projectId, payload) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/evaluation`, payload);
  return data;
};

const fetchEvaluation = async (projectId) => {
  const { data } = await api.get(`/api/teacher/projects/${projectId}/evaluation`);
  return data;
};

const fetchGradingTemplates = async () => {
  const { data } = await api.get("/api/teacher/grading-templates");
  return data;
};

const updateProjectGradingTemplate = async (projectId, templateId) => {
  const { data } = await api.patch(`/api/teacher/projects/${projectId}`, {
    gradingTemplate: templateId,
  });
  return data;
};

const createGradingTemplate = async (payload) => {
  const { data } = await api.post("/api/teacher/grading-templates", payload);
  return data;
};

const markProjectCompleted = async (projectId) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/complete`);
  return data;
};

const analyzeProposal = async (projectId) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/analyze`);
  return data;
};

const generateProposalReview = async (projectId, decision) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/generate-review`, { decision });
  return data;
};

const generateProjectHealth = async (projectId) => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/health`);
  return data;
};

const generateProjectFeedbackDraft = async (projectId, tone = "professional") => {
  const { data } = await api.post(`/api/teacher/projects/${projectId}/feedback/draft`, { tone });
  return data;
};

const fetchAIEvaluationJustification = async (projectId) => {
  const { data } = await api.get(`/api/teacher/projects/${projectId}/evaluation/ai-justification`);
  return data;
};

const finalizeMeetingWithAI = async (logId, payload = {}) => {
  const { data } = await api.post(`/api/teacher/meetings/${logId}/finalize`, payload);
  return data;
};

const updateMeetingLog = async (logId, payload) => {
  const { data } = await api.patch(`/api/teacher/meetings/${logId}`, payload);
  return data;
};

export default {
  fetchAssignedGroups,
  fetchAtRiskGroups,
  warnGroup,
  fetchGroupDetails,
  fetchGroupWorkspace,
  fetchProjectProposals,
  approveProject,
  rejectProject,
  fetchProjectFeedback,
  addProjectFeedback,
  fetchGroupMeetings,
  createGroupMeeting,
  deleteMeetingLog,
  markMeetingAttendance,
  fetchPendingAttendanceMeetings,
  fetchProjectDeadlines,
  createProjectDeadline,
  deleteDeadline,
  overrideDeadlineStatus,
  fetchGroupResources,
  fetchCompletionMetrics,
  fetchSuggestedGrades,
  saveEvaluation,
  fetchEvaluation,
  markProjectCompleted,
  analyzeProposal,
  generateProposalReview,
  generateProjectHealth,
  generateProjectFeedbackDraft,
  fetchAIEvaluationJustification,
  finalizeMeetingWithAI,
  updateMeetingLog,
  fetchGradingTemplates,
  updateProjectGradingTemplate,
  createGradingTemplate,
  fetchProjectEvidence: (projectId) => api.get(`/api/teacher/projects/${projectId}/evidence`).then(r => r.data),
  validateProjectEvidence: (projectId, evidenceId, payload) => api.patch(`/api/teacher/projects/${projectId}/evidence/${evidenceId}`, payload).then(r => r.data),
  fetchProjectMilestones: (projectId) => api.get(`/api/teacher/projects/${projectId}/milestones`).then(r => r.data),
  createProjectMilestone: (projectId, payload) => api.post(`/api/teacher/projects/${projectId}/milestones`, payload).then(r => r.data),
  updateProjectMilestone: (projectId, milestoneId, payload) => api.patch(`/api/teacher/projects/${projectId}/milestones/${milestoneId}`, payload).then(r => r.data),
  deleteProjectMilestone: (projectId, milestoneId) => api.delete(`/api/teacher/projects/${projectId}/milestones/${milestoneId}`).then(r => r.data),
  fetchRubricCriteria: () => api.get('/api/teacher/projects/rubric-criteria').then(r => r.data),
};
