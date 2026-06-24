import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice.js";
import authReducer from "../features/auth/authSlice.js";
import adminReducer from "../features/admin/slices/adminSlice.js";
import studentReducer from "../features/student/slices/studentSlice.js";
import teacherReducer from "../features/teacher/slices/teacherSlice.js";
import { apiSlice } from "../services/api/apiSlice.js";

const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    admin: adminReducer,
    student: studentReducer,
    teacher: teacherReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export default store;
