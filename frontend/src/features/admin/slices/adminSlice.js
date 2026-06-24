import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import adminApi from "../api/adminApi.js";

const normalizeList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  return [];
};

export const fetchAdminAnalytics = createAsyncThunk(
  "admin/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.fetchAnalytics();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load analytics",
      );
    }
  },
);

export const fetchAtRiskGroups = createAsyncThunk(
  "admin/fetchAtRiskGroups",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.fetchAtRiskGroups();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load at-risk groups",
      );
    }
  },
);

export const fetchPreApproved = createAsyncThunk(
  "admin/fetchPreApproved",
  async (params, { rejectWithValue }) => {
    try {
      return await adminApi.fetchPreApproved(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load preapproved students",
      );
    }
  },
);

export const uploadPreApprovedCsv = createAsyncThunk(
  "admin/uploadPreApprovedCsv",
  async (file, { rejectWithValue }) => {
    try {
      return await adminApi.uploadPreApprovedCsv(file);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload CSV",
      );
    }
  },
);

export const updatePreApproved = createAsyncThunk(
  "admin/updatePreApproved",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await adminApi.updatePreApproved(id, payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update preapproved student",
      );
    }
  },
);

export const deletePreApproved = createAsyncThunk(
  "admin/deletePreApproved",
  async (id, { rejectWithValue }) => {
    try {
      return await adminApi.deletePreApproved(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete preapproved student",
      );
    }
  },
);

export const clearPreApproved = createAsyncThunk(
  "admin/clearPreApproved",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.clearPreApproved();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear preapproved students",
      );
    }
  },
);

export const fetchStudents = createAsyncThunk(
  "admin/fetchStudents",
  async (params, { rejectWithValue }) => {
    try {
      return await adminApi.fetchStudents(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load students",
      );
    }
  },
);

export const fetchStudentDetail = createAsyncThunk(
  "admin/fetchStudentDetail",
  async (studentId, { rejectWithValue }) => {
    try {
      return await adminApi.fetchStudentDetail(studentId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load student detail",
      );
    }
  },
);

export const fetchAnnouncements = createAsyncThunk(
  "admin/fetchAnnouncements",
  async (params, { rejectWithValue }) => {
    try {
      return await adminApi.fetchAnnouncements(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load broadcast notifications",
      );
    }
  },
);

export const createAnnouncement = createAsyncThunk(
  "admin/createAnnouncement",
  async (payload, { rejectWithValue }) => {
    try {
      return await adminApi.createAnnouncement(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create broadcast notification",
      );
    }
  },
);

export const deleteAnnouncement = createAsyncThunk(
  "admin/deleteAnnouncement",
  async (id, { rejectWithValue }) => {
    try {
      return await adminApi.deleteAnnouncement(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete broadcast notification",
      );
    }
  },
);

export const fetchFaculty = createAsyncThunk(
  "admin/fetchFaculty",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.fetchFaculty();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load faculty",
      );
    }
  },
);

export const fetchSupervisors = createAsyncThunk(
  "admin/fetchSupervisors",
  async (_, { rejectWithValue }) => {
    try {
      return await adminApi.fetchSupervisors();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load supervisors",
      );
    }
  },
);

export const fetchGroupsByStatus = createAsyncThunk(
  "admin/fetchGroupsByStatus",
  async (status, { rejectWithValue }) => {
    try {
      return { status, data: await adminApi.fetchGroupsByStatus(status) };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load groups",
      );
    }
  },
);

export const fetchGroupById = createAsyncThunk(
  "admin/fetchGroupById",
  async (groupId, { rejectWithValue }) => {
    try {
      const data = await adminApi.fetchGroupById(groupId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load groups",
      );
    }
  },
);

export const approveGroup = createAsyncThunk(
  "admin/approveGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      return await adminApi.approveGroup(groupId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve group",
      );
    }
  },
);

export const rejectGroup = createAsyncThunk(
  "admin/rejectGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      return await adminApi.rejectGroup(groupId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject group",
      );
    }
  },
);

export const fetchFacultyById = createAsyncThunk(
  "admin/fetchFacultyById",
  async (teacherId, { rejectWithValue }) => {
    try {
      const res = await adminApi.fetchFacultyById(teacherId);

      return res;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load faculty details",
      );
    }
  },
);

export const fetchFacultyGroups = createAsyncThunk(
  "admin/fetchFacultyGroups",
  async (teacherId, { rejectWithValue }) => {
    try {
      return await adminApi.fetchFacultyGroups(teacherId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load faculty groups",
      );
    }
  },
);

export const createFaculty = createAsyncThunk(
  "admin/createFaculty",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await adminApi.createFaculty(payload);

      return res;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create faculty",
      );
    }
  },
);

export const updateFaculty = createAsyncThunk(
  "admin/updateFaculty",
  async ({ teacherId, payload }, { rejectWithValue }) => {
    try {
      return await adminApi.updateFaculty(teacherId, payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update faculty",
      );
    }
  },
);
export const updateFacultyCapacity = createAsyncThunk(
  "admin/updateFacultyCapacity",
  async ({ teacherId, supervisorCapacity }, { rejectWithValue }) => {
    try {
      return await adminApi.updateFacultyCapacity(
        teacherId,
        supervisorCapacity,
      );
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update capacity",
      );
    }
  },
);

export const deleteFaculty = createAsyncThunk(
  "admin/deleteFaculty",
  async (teacherId, { rejectWithValue }) => {
    try {
      return await adminApi.deleteFaculty(teacherId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete faculty",
      );
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    analytics: null,
    atRiskGroups: { orphanGroups: [], unresponsiveSupervisors: [], failingGroups: [] },
    atRiskStatus: "idle",
    status: "idle",
    error: null,
    faculty: [],
    supervisors: [],
    facultyStatus: "idle",
    facultyDetail: null,
    facultyDetailStatus: "idle",
    facultyGroups: [],
    facultyGroupsStatus: "idle",
    facultyActionStatus: "idle",
    supervisorsStatus: "idle",
    preApproved: [],
    preApprovedStatus: "idle",
    preApprovedActionStatus: "idle",
    students: [],
    studentsStatus: "idle",
    studentDetail: null,
    studentDetailStatus: "idle",
    announcements: [],
    announcementsStatus: "idle",
    announcementsActionStatus: "idle",
    groupsByStatus: {
      pending: [],
      active: [],
      rejected: [],
    },
    groupDetail: null,
    groupsStatus: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.analytics = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchAtRiskGroups.pending, (state) => {
        state.atRiskStatus = "loading";
      })
      .addCase(fetchAtRiskGroups.fulfilled, (state, action) => {
        state.atRiskStatus = "succeeded";
        state.atRiskGroups = action.payload?.data || { orphanGroups: [], unresponsiveSupervisors: [], failingGroups: [] };
      })
      .addCase(fetchAtRiskGroups.rejected, (state) => {
        state.atRiskStatus = "failed";
      })
      .addCase(fetchFaculty.pending, (state) => {
        state.facultyStatus = "loading";
      })
      .addCase(fetchFaculty.fulfilled, (state, action) => {
        state.facultyStatus = "succeeded";
        state.faculty = normalizeList(action.payload, "teachers");
      })
      .addCase(fetchFaculty.rejected, (state) => {
        state.facultyStatus = "failed";
      })
      .addCase(fetchSupervisors.pending, (state) => {
        state.supervisorsStatus = "loading";
      })
      .addCase(fetchSupervisors.fulfilled, (state, action) => {
        state.supervisorsStatus = "succeeded";
        state.supervisors = normalizeList(action.payload, "supervisors");
      })
      .addCase(fetchSupervisors.rejected, (state) => {
        state.supervisorsStatus = "failed";
      })
      .addCase(fetchGroupsByStatus.pending, (state) => {
        state.groupsStatus = "loading";
      })
      .addCase(fetchGroupById.pending, (state) => {
        state.groupsStatus = "loading";
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.groupsStatus = "succeeded";
        state.groupDetail = action.payload;
      })
      .addCase(fetchGroupById.rejected, (state) => {
        state.groupsStatus = "failed";
      })
      .addCase(fetchGroupsByStatus.fulfilled, (state, action) => {
        state.groupsStatus = "succeeded";
        state.groupsByStatus[action.payload.status] = normalizeList(
          action.payload.data,
          "groups",
        );
      })
      .addCase(fetchGroupsByStatus.rejected, (state) => {
        state.groupsStatus = "failed";
      })
      .addCase(approveGroup.pending, (state) => {
        state.groupsStatus = "loading";
      })
      .addCase(approveGroup.fulfilled, (state) => {
        state.groupsStatus = "succeeded";
      })
      .addCase(approveGroup.rejected, (state) => {
        state.groupsStatus = "failed";
      })
      .addCase(rejectGroup.pending, (state) => {
        state.groupsStatus = "loading";
      })
      .addCase(rejectGroup.fulfilled, (state) => {
        state.groupsStatus = "succeeded";
      })
      .addCase(rejectGroup.rejected, (state) => {
        state.groupsStatus = "failed";
      })
      .addCase(fetchFacultyById.pending, (state) => {
        state.facultyDetailStatus = "loading";
      })
      .addCase(fetchFacultyById.fulfilled, (state, action) => {
        state.facultyDetailStatus = "succeeded";
        state.facultyDetail = action.payload.teacher || action.payload;
      })
      .addCase(fetchFacultyById.rejected, (state) => {
        state.facultyDetailStatus = "failed";
      })
      .addCase(fetchFacultyGroups.pending, (state) => {
        state.facultyGroupsStatus = "loading";
      })
      .addCase(fetchFacultyGroups.fulfilled, (state, action) => {
        state.facultyGroupsStatus = "succeeded";
        state.facultyGroups = action.payload.groups || action.payload;
      })
      .addCase(fetchFacultyGroups.rejected, (state) => {
        state.facultyGroupsStatus = "failed";
      })
      .addCase(createFaculty.pending, (state) => {
        state.facultyActionStatus = "loading";
        state.error = null;
      })
      .addCase(createFaculty.fulfilled, (state) => {
        state.facultyActionStatus = "succeeded";
      })
      .addCase(createFaculty.rejected, (state, action) => {
        state.facultyActionStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updateFaculty.pending, (state) => {
        state.facultyActionStatus = "loading";
      })
      .addCase(updateFaculty.fulfilled, (state) => {
        state.facultyActionStatus = "succeeded";
      })
      .addCase(updateFaculty.rejected, (state) => {
        state.facultyActionStatus = "failed";
      })
      .addCase(updateFacultyCapacity.pending, (state) => {
        state.facultyActionStatus = "loading";
      })
      .addCase(updateFacultyCapacity.fulfilled, (state) => {
        state.facultyActionStatus = "succeeded";
      })
      .addCase(updateFacultyCapacity.rejected, (state) => {
        state.facultyActionStatus = "failed";
      })
      .addCase(deleteFaculty.pending, (state) => {
        state.facultyActionStatus = "loading";
      })
      .addCase(deleteFaculty.fulfilled, (state) => {
        state.facultyActionStatus = "succeeded";
      })
      .addCase(deleteFaculty.rejected, (state) => {
        state.facultyActionStatus = "failed";
      })
      .addCase(fetchPreApproved.pending, (state) => {
        state.preApprovedStatus = "loading";
      })
      .addCase(fetchPreApproved.fulfilled, (state, action) => {
        state.preApprovedStatus = "succeeded";
        state.preApproved = normalizeList(
          action.payload,
          "preApprovedStudentsList",
        );
      })
      .addCase(fetchPreApproved.rejected, (state) => {
        state.preApprovedStatus = "failed";
      })
      .addCase(uploadPreApprovedCsv.pending, (state) => {
        state.preApprovedActionStatus = "loading";
        state.error = null;
      })
      .addCase(uploadPreApprovedCsv.fulfilled, (state) => {
        state.preApprovedActionStatus = "succeeded";
      })
      .addCase(uploadPreApprovedCsv.rejected, (state, action) => {
        state.preApprovedActionStatus = "failed";
        state.error = action.payload;
      })
      .addCase(updatePreApproved.pending, (state) => {
        state.preApprovedActionStatus = "loading";
      })
      .addCase(updatePreApproved.fulfilled, (state) => {
        state.preApprovedActionStatus = "succeeded";
      })
      .addCase(updatePreApproved.rejected, (state) => {
        state.preApprovedActionStatus = "failed";
      })
      .addCase(deletePreApproved.pending, (state) => {
        state.preApprovedActionStatus = "loading";
      })
      .addCase(deletePreApproved.fulfilled, (state) => {
        state.preApprovedActionStatus = "succeeded";
      })
      .addCase(deletePreApproved.rejected, (state) => {
        state.preApprovedActionStatus = "failed";
      })
      .addCase(clearPreApproved.pending, (state) => {
        state.preApprovedActionStatus = "loading";
      })
      .addCase(clearPreApproved.fulfilled, (state) => {
        state.preApprovedActionStatus = "succeeded";
      })
      .addCase(clearPreApproved.rejected, (state) => {
        state.preApprovedActionStatus = "failed";
      })
      .addCase(fetchStudents.pending, (state) => {
        state.studentsStatus = "loading";
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.studentsStatus = "succeeded";
        state.students = normalizeList(action.payload, "students");
      })
      .addCase(fetchStudents.rejected, (state) => {
        state.studentsStatus = "failed";
      })
      .addCase(fetchStudentDetail.pending, (state) => {
        state.studentDetailStatus = "loading";
      })
      .addCase(fetchStudentDetail.fulfilled, (state, action) => {
        state.studentDetailStatus = "succeeded";
        state.studentDetail = action.payload.student || action.payload;
      })
      .addCase(fetchStudentDetail.rejected, (state) => {
        state.studentDetailStatus = "failed";
      })
      .addCase(fetchAnnouncements.pending, (state) => {
        state.announcementsStatus = "loading";
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcementsStatus = "succeeded";
        state.announcements = normalizeList(action.payload, "announcements");
      })
      .addCase(fetchAnnouncements.rejected, (state) => {
        state.announcementsStatus = "failed";
      })
      .addCase(createAnnouncement.pending, (state) => {
        state.announcementsActionStatus = "loading";
      })
      .addCase(createAnnouncement.fulfilled, (state) => {
        state.announcementsActionStatus = "succeeded";
      })
      .addCase(createAnnouncement.rejected, (state) => {
        state.announcementsActionStatus = "failed";
      })
      .addCase(deleteAnnouncement.pending, (state) => {
        state.announcementsActionStatus = "loading";
      })
      .addCase(deleteAnnouncement.fulfilled, (state) => {
        state.announcementsActionStatus = "succeeded";
      })
      .addCase(deleteAnnouncement.rejected, (state) => {
        state.announcementsActionStatus = "failed";
      });
  },
});

export default adminSlice.reducer;

