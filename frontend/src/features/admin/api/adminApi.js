import api from "../../../services/api/client.js";

const fetchAnalytics = async () => {
  const { data } = await api.get("/api/admin/analytics");
  return data;
};

const fetchAtRiskGroups = async () => {
  const { data } = await api.get("/api/admin/analytics/at-risk");
  return data;
};

const fetchAnalyticsNarrative = async () => {
  const { data } = await api.get("/api/admin/analytics/narrative");
  return data;
};

const fetchStrategicCapacityAnalysis = async () => {
  const { data } = await api.get("/api/admin/analytics/strategic-capacity");
  return data;
};

const fetchFaculty = async () => {
  const { data } = await api.get("/api/admin/teachers");
  return data;
};

const fetchSupervisors = async () => {
  const { data } = await api.get("/api/admin/supervisors");
  return data;
};

const fetchGroupsByStatus = async (status) => {
  const query = status ? `?status=${status}` : "";
  const { data } = await api.get(`/api/admin/groups${query}`);

  return data;
};
const fetchGroupById = async (groupId) => {
  const { data } = await api.get(`/api/admin/groups/${groupId}`);
  return data;
};

const fetchFacultyById = async (teacherId) => {
  const { data } = await api.get(`/api/admin/teachers/${teacherId}`);

  return data;
};

const fetchFacultyGroups = async (teacherId) => {
  const { data } = await api.get(`/api/admin/teachers/${teacherId}/groups`);
  return data;
};

const createFaculty = async (payload) => {
  const { data } = await api.post("/api/admin/teachers", payload);
  return data;
};

const updateFaculty = async (teacherId, payload) => {
  const { data } = await api.put(`/api/admin/teachers/${teacherId}`, payload);
  return data;
};

const updateFacultyCapacity = async (teacherId, supervisorCapacity) => {
  const { data } = await api.patch(
    `/api/admin/teachers/${teacherId}/capacity`,
    { supervisorCapacity },
  );
  return data;
};

const deleteFaculty = async (teacherId) => {
  const { data } = await api.delete(`/api/admin/teachers/${teacherId}`);
  return data;
};

const deleteGroup = async (groupId) => {
  const { data } = await api.delete(`/api/admin/groups/${groupId}`);
  return data;
};

const fetchPreApproved = async (params = {}) => {
  const query = new URLSearchParams(params);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await api.get(`/api/admin/preapproved${suffix}`);
  return data;
};

const uploadPreApprovedCsv = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/admin/preapproved/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const updatePreApproved = async (id, payload) => {
  const { data } = await api.put(`/api/admin/preapproved/${id}`, payload);
  return data;
};

const deletePreApproved = async (id) => {
  const { data } = await api.delete(`/api/admin/preapproved/${id}`);
  return data;
};

const clearPreApproved = async () => {
  const { data } = await api.delete("/api/admin/preapproved");
  return data;
};

const fetchStudents = async (params = {}) => {
  const query = new URLSearchParams(params);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await api.get(`/api/admin/students${suffix}`);
  return data;
};

const fetchStudentDetail = async (studentId) => {
  const { data } = await api.get(`/api/admin/students/${studentId}`);
  return data;
};

const fetchAnnouncements = async (params = {}) => {
  const query = new URLSearchParams(params);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { data } = await api.get(`/api/notifications/broadcasts${suffix}`);
  return data;
};

const createAnnouncement = async (payload) => {
  const { data } = await api.post("/api/admin/broadcasts", payload);
  return data;
};

const deleteAnnouncement = async (id) => {
  const { data } = await api.delete(`/api/admin/broadcasts/${id}`);
  return data;
};

const approveGroup = async (groupId) => {
  const { data } = await api.patch(`/api/admin/groups/${groupId}/approve`);
  return data;
};

const rejectGroup = async (groupId) => {
  const { data } = await api.patch(`/api/admin/groups/${groupId}/reject`);
  return data;
};

const assignSupervisor = async ({ groupId, supervisorId }) => {
  const { data } = await api.post("/api/admin/supervisors/assign", {
    groupId,
    supervisorId,
  });
  return data;
};

const fetchSupervisorRecommendations = async (department) => {
  const query = department ? `?department=${department}` : "";
  const { data } = await api.get(
    `/api/admin/supervisors/recommendations${query}`,
  );
  return data;
};

const fetchSupervisorWorkload = async (supervisorId) => {
  const { data } = await api.get(
    `/api/admin/supervisors/${supervisorId}/workload`,
  );
  return data;
};

const assignGroupSupervisor = async (groupId, supervisorId) => {
  const { data } = await api.post(`/api/admin/groups/${groupId}/supervisor`, {
    supervisorId,
  });
  return data;
};

const fetchSupervisorRequests = async (status = "pending") => {
  const query = status ? `?status=${status}` : "";
  const { data } = await api.get(
    `/api/admin/groups/supervisor-requests/list${query}`,
  );
  return data;
};

const reviewSupervisorRequest = async ({ requestId, approve, reviewNote }) => {
  const { data } = await api.patch(
    `/api/admin/groups/supervisor-requests/${requestId}/review`,
    { approve, reviewNote },
  );
  return data;
};

const warnGroup = async (groupId, issues = []) => {
  const { data } = await api.post(`/api/admin/analytics/at-risk/${groupId}/warn`, { issues });
  return data;
};

const fetchEvaluationStats = async () => {
  const { data } = await api.get("/api/admin/evaluations/stats");
  return data;
};

const runSystemAudit = async () => {
  const { data } = await api.post("/api/admin/analytics/run-audit");
  return data;
};

const fetchSignals = async (status = "open") => {
  const { data } = await api.get(`/api/admin/analytics/signals?status=${status}`);
  return data;
};

const resolveSignal = async (signalId, note, actions = {}) => {
  const { data } = await api.patch(`/api/admin/analytics/signals/${signalId}/resolve`, {
    note,
    actions,
  });
  return data;
};

const fetchAllEvaluations = async () => {
  const { data } = await api.get("/api/admin/evaluations");
  return data;
};

const fetchEvaluationsByDepartment = async () => {
  const { data } = await api.get("/api/admin/evaluations/by-department");
  return data;
};

const fetchEvaluationsBySupervisor = async () => {
  const { data } = await api.get("/api/admin/evaluations/by-supervisor");
  return data;
};

const fetchProjectHealthForecast = async (groupId) => {
  const { data } = await api.get(`/api/admin/analytics/groups/${groupId}/health-forecast`);
  return data;
};

const fetchRubricAlignmentReport = async (groupId) => {
  const { data } = await api.get(`/api/rubrics/alignment/${groupId}`);
  return data;
};

export default {
  fetchAnalytics,
  fetchAtRiskGroups,
  fetchFaculty,
  fetchSupervisors,
  fetchFacultyById,

  fetchGroupById,
  fetchGroupsByStatus,
  fetchFacultyGroups,

  createFaculty,
  updateFaculty,
  updateFacultyCapacity,
  deleteFaculty,
  approveGroup,
  rejectGroup,
  deleteGroup,
  assignSupervisor,
  fetchSupervisorRecommendations,
  fetchSupervisorWorkload,
  fetchPreApproved,
  uploadPreApprovedCsv,
  updatePreApproved,
  deletePreApproved,
  clearPreApproved,
  fetchStudents,
  fetchStudentDetail,
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  assignGroupSupervisor,
  fetchSupervisorRequests,
  reviewSupervisorRequest,
  warnGroup,
  fetchAnalyticsNarrative,
  fetchStrategicCapacityAnalysis,
  
  fetchEvaluationStats,
  fetchAllEvaluations,
  fetchEvaluationsByDepartment,
  fetchEvaluationsBySupervisor,
  runSystemAudit,
  fetchSignals,
  resolveSignal,
  fetchProjectHealthForecast,
  fetchRubricAlignmentReport,
};
