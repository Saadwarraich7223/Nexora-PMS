import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import teacherApi from "../api/teacherApi.js";

export const fetchTeacherWorkspace = createAsyncThunk(
  "teacher/fetchWorkspace",
  async (_, { rejectWithValue }) => {
    try {
      const [groupsRes, projectsRes] = await Promise.all([
        teacherApi.fetchAssignedGroups(),
        teacherApi.fetchProjectProposals(),
      ]);

      return {
        groups: groupsRes.groups || [],
        projects: projectsRes.projects || [],
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load teacher workspace",
      );
    }
  },
);

export const fetchAtRiskGroups = createAsyncThunk(
  "teacher/fetchAtRiskGroups",
  async (_, { rejectWithValue }) => {
    try {
      return await teacherApi.fetchAtRiskGroups();
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to load at-risk groups",
      );
    }
  }
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState: {
    groups: [],
    projects: [],
    atRiskGroups: [],
    atRiskStatus: "idle",
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeacherWorkspace.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTeacherWorkspace.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.groups = action.payload.groups;
        state.projects = action.payload.projects;
      })
      .addCase(fetchTeacherWorkspace.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchAtRiskGroups.pending, (state) => {
        state.atRiskStatus = "loading";
      })
      .addCase(fetchAtRiskGroups.fulfilled, (state, action) => {
        state.atRiskStatus = "succeeded";
        state.atRiskGroups = action.payload?.data || (Array.isArray(action.payload) ? action.payload : []);
      })
      .addCase(fetchAtRiskGroups.rejected, (state) => {
        state.atRiskStatus = "failed";
      });
  },
});

export default teacherSlice.reducer;
