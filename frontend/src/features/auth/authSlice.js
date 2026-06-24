import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authApi from "../../services/api/authApi.js";

export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const user = await authApi.login(payload);
      console.log(user);
      return user;
    } catch (error) {
      console.log(error);
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.me();

      return user;
    } catch (error) {
      return rejectWithValue(null);
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    status: "idle",
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        console.log(state.user);
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.status = "failed";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "succeeded";
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
