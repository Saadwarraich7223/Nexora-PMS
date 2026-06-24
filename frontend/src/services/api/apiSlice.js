import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
  credentials: "include",
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Attempt reauth
    const refreshResult = await baseQuery(
      { url: "/api/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Retry original query
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed
      // api.dispatch(logout()); // Could dispatch logout here if we had the action
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdminAnalytics", "Group", "Faculty", "Student", "AtRiskGroups"],
  endpoints: (builder) => ({}),
});
