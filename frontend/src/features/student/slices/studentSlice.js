import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import studentApi from "../api/studentApi.js";

const safeRequest = async (fn, fallback) => {
  try {
    return await fn();
  } catch (error) {
    const status = error?.response?.status;
    if (status === 400 || status === 403 || status === 404) {
      return fallback;
    }
    throw error;
  }
};

export const fetchStudentPreview = createAsyncThunk(
  "student/fetchPreview",
  async (_, { rejectWithValue }) => {
    try {
      const [
        groupRes,
        invitesRes,
        joinRequestsRes,
        tasksRes,
        projectRes,
        deadlinesRes,
        meetingsRes,
        notificationsRes,
        supervisorRequestRes,
      ] = await Promise.all([
        safeRequest(() => studentApi.fetchMyGroup(), { group: null }),
        safeRequest(() => studentApi.fetchInvites(), { invites: [] }),
        safeRequest(() => studentApi.fetchJoinRequests(), { requests: [] }),
        safeRequest(() => studentApi.fetchTasks(), { tasks: [] }),
        safeRequest(() => studentApi.fetchProject(), { project: null }),
        safeRequest(() => studentApi.fetchDeadlines(), { deadlines: [] }),
        safeRequest(() => studentApi.fetchMeetings(), { logs: [] }),
        safeRequest(() => studentApi.fetchNotifications(), {
          notifications: [],
        }),
        safeRequest(() => studentApi.fetchMySupervisorRequest(), { request: null }),
      ]);

      return {
        group: groupRes.group || null,
        invites: invitesRes.invites || [],
        joinRequests: joinRequestsRes.requests || [],
        tasks: tasksRes.tasks || [],
        project: projectRes.project || null,
        deadlines: deadlinesRes.deadlines || [],
        meetings: meetingsRes.logs || [],
        notifications: notificationsRes.notifications || [],
        supervisorRequest: supervisorRequestRes.request || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load student preview",
      );
    }
  },
);

export const fetchStudentGroupsWorkspace = createAsyncThunk(
  "student/fetchGroupsWorkspace",
  async (_, { rejectWithValue }) => {
    try {
      const fallback = {
        myGroup: { group: null },
        invites: { invites: [] },
        requests: { requests: [] },
        groups: { groups: [] },
        students: { students: [] },
        availableSupervisors: { supervisors: [] },
        supervisorRequest: { request: null },
      };

      const settled = await Promise.allSettled([
        studentApi.fetchMyGroup(),
        studentApi.fetchInvites(),
        studentApi.fetchJoinRequests(),
        studentApi.fetchRelatedGroups(),
        studentApi.fetchRelatedStudents(),
        studentApi.fetchAvailableSupervisors(),
        studentApi.fetchMySupervisorRequest(),
      ]);

      const [
        myGroupRes,
        invitesRes,
        requestsRes,
        groupsRes,
        studentsRes,
        availableSupervisorsRes,
        supervisorRequestRes,
      ] = settled.map((result, index) => {
        if (result.status === "fulfilled") return result.value;
        if (index === 0) return fallback.myGroup;
        if (index === 1) return fallback.invites;
        if (index === 2) return fallback.requests;
        if (index === 3) return fallback.groups;
        if (index === 4) return fallback.students;
        if (index === 5) return fallback.availableSupervisors;
        return fallback.supervisorRequest;
      });

      return {
        myGroup: myGroupRes.group || null,
        invites: invitesRes.invites || [],
        joinRequests: requestsRes.requests || [],
        relatedGroups: groupsRes.groups || [],
        relatedStudents: studentsRes.students || [],
        availableSupervisors: availableSupervisorsRes.supervisors || [],
        supervisorRequest: supervisorRequestRes.request || null,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load groups workspace",
      );
    }
  },
);

export const createStudentGroup = createAsyncThunk(
  "student/createGroup",
  async (payload, { rejectWithValue }) => {
    try {
      return await studentApi.createGroup(payload);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create group",
      );
    }
  },
);

export const requestJoinGroup = createAsyncThunk(
  "student/requestJoinGroup",
  async (groupId, { rejectWithValue }) => {
    try {
      return await studentApi.requestJoinGroup(groupId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to request group join",
      );
    }
  },
);

export const respondInvite = createAsyncThunk(
  "student/respondInvite",
  async ({ inviteId, accept }, { rejectWithValue }) => {
    try {
      return await studentApi.respondInvite({ inviteId, accept });
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to respond to invite",
      );
    }
  },
);

export const respondJoinRequest = createAsyncThunk(
  "student/respondJoinRequest",
  async ({ requestId, accept }, { rejectWithValue }) => {
    try {
      return await studentApi.respondJoinRequest({ requestId, accept });
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to respond to join request",
      );
    }
  },
);

export const inviteStudent = createAsyncThunk(
  "student/inviteStudent",
  async (receiverId, { rejectWithValue }) => {
    try {
      return await studentApi.inviteStudent(receiverId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to invite student",
      );
    }
  },
);

export const submitGroupForApproval = createAsyncThunk(
  "student/submitGroupForApproval",
  async (_, { rejectWithValue }) => {
    try {
      return await studentApi.submitGroupForApproval();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to submit group",
      );
    }
  },
);

export const leaveStudentGroup = createAsyncThunk(
  "student/leaveGroup",
  async (_, { rejectWithValue }) => {
    try {
      return await studentApi.leaveGroup();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to leave group",
      );
    }
  },
);

export const removeStudentMember = createAsyncThunk(
  "student/removeMember",
  async (userId, { rejectWithValue }) => {
    try {
      return await studentApi.removeMember(userId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to remove member",
      );
    }
  },
);

export const transferStudentLeadership = createAsyncThunk(
  "student/transferLeadership",
  async (newLeaderId, { rejectWithValue }) => {
    try {
      return await studentApi.transferLeadership(newLeaderId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to transfer leadership",
      );
    }
  },
);

export const deleteStudentGroup = createAsyncThunk(
  "student/deleteGroup",
  async (_, { rejectWithValue }) => {
    try {
      return await studentApi.deleteGroup();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete group",
      );
    }
  },
);

export const requestStudentSupervisor = createAsyncThunk(
  "student/requestSupervisor",
  async ({ supervisorId, note }, { rejectWithValue }) => {
    try {
      return await studentApi.createSupervisorRequest({ supervisorId, note });
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to submit supervisor request",
      );
    }
  },
);

export const cancelStudentSupervisorRequest = createAsyncThunk(
  "student/cancelSupervisorRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      return await studentApi.cancelSupervisorRequest(requestId);
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to cancel supervisor request",
      );
    }
  },
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    preview: {
      group: null,
      invites: [],
      joinRequests: [],
      tasks: [],
      project: null,
      deadlines: [],
      meetings: [],
      notifications: [],
      supervisorRequest: null,
    },
    groupsWorkspace: {
      myGroup: null,
      invites: [],
      joinRequests: [],
      relatedGroups: [],
      relatedStudents: [],
      availableSupervisors: [],
      supervisorRequest: null,
    },
    status: "idle",
    groupsStatus: "idle",
    actionStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentPreview.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchStudentPreview.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.preview = action.payload;
      })
      .addCase(fetchStudentPreview.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchStudentGroupsWorkspace.pending, (state) => {
        state.groupsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchStudentGroupsWorkspace.fulfilled, (state, action) => {
        state.groupsStatus = "succeeded";
        state.groupsWorkspace = action.payload;
      })
      .addCase(fetchStudentGroupsWorkspace.rejected, (state, action) => {
        state.groupsStatus = "failed";
        state.error = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("student/") &&
          action.type.endsWith("/pending") &&
          !action.type.includes("fetch"),
        (state) => {
          state.actionStatus = "loading";
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("student/") &&
          action.type.endsWith("/fulfilled") &&
          !action.type.includes("fetch"),
        (state) => {
          state.actionStatus = "succeeded";
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("student/") &&
          action.type.endsWith("/rejected") &&
          !action.type.includes("fetch"),
        (state, action) => {
          state.actionStatus = "failed";
          state.error = action.payload;
        },
      );
  },
});

export default studentSlice.reducer;
