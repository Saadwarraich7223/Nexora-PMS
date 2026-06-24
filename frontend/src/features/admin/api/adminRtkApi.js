import { apiSlice } from "../../../services/api/apiSlice.js";

export const adminRtkApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query({
      query: () => "/api/admin/analytics",
      transformResponse: (response) => response.data || {},
      providesTags: ["AdminAnalytics"],
    }),
    getAtRiskGroups: builder.query({
      query: () => "/api/admin/analytics/at-risk",
      transformResponse: (response) => response.data || [],
      providesTags: ["AtRiskGroups"],
    }),
    getAnalyticsNarrative: builder.query({
      query: () => "/api/admin/analytics/narrative",
      transformResponse: (response) => response.data || {},
      providesTags: ["AdminAnalytics"],
    }),
    getFaculty: builder.query({
      query: () => "/api/admin/teachers",
      transformResponse: (response) => response.teachers || [],
      providesTags: ["Faculty"],
    }),
    getSupervisors: builder.query({
      query: () => "/api/admin/supervisors",
      transformResponse: (response) => response.supervisors || [],
      providesTags: ["Faculty"],
    }),
    getGroupsByStatus: builder.query({
      query: (status) => `/api/admin/groups${status ? `?status=${status}` : ""}`,
      transformResponse: (response) => response.groups || [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map(({ _id }) => ({ type: "Group", id: _id })),
              { type: "Group", id: "LIST" },
            ]
          : [{ type: "Group", id: "LIST" }],
    }),
    getGroupById: builder.query({
      query: (id) => `/api/admin/groups/${id}`,
      transformResponse: (response) => response.group || {},
      providesTags: (result, error, id) => [{ type: "Group", id }],
    }),
    approveGroup: builder.mutation({
      query: (id) => ({
        url: `/api/admin/groups/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Group", id },
        { type: "Group", id: "LIST" },
        "AdminAnalytics",
        "AtRiskGroups",
      ],
    }),
    rejectGroup: builder.mutation({
      query: (id) => ({
        url: `/api/admin/groups/${id}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Group", id },
        { type: "Group", id: "LIST" },
        "AdminAnalytics",
        "AtRiskGroups",
      ],
    }),
    reviewSupervisorRequest: builder.mutation({
      query: ({ requestId, approve, reviewNote }) => ({
        url: `/api/admin/groups/supervisor-requests/${requestId}/review`,
        method: "PATCH",
        body: { approve, reviewNote },
      }),
      invalidatesTags: ["AdminAnalytics", "Group", "Faculty"],
    }),
    getSupervisorRequests: builder.query({
      query: (status = "pending") =>
        `/api/admin/groups/supervisor-requests/list${status ? `?status=${status}` : ""}`,
      transformResponse: (response) => response.requests || [],
      providesTags: ["Group"],
    }),
    getStudents: builder.query({
      query: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return `/api/admin/students${query ? `?${query}` : ""}`;
      },
      transformResponse: (response) => response.students || [],
      providesTags: ["Student"],
    }),
  }),
});

export const {
  useGetAdminAnalyticsQuery,
  useGetAtRiskGroupsQuery,
  useGetAnalyticsNarrativeQuery,
  useGetFacultyQuery,
  useGetSupervisorsQuery,
  useGetGroupsByStatusQuery,
  useGetGroupByIdQuery,
  useApproveGroupMutation,
  useRejectGroupMutation,
  useReviewSupervisorRequestMutation,
  useGetSupervisorRequestsQuery,
  useGetStudentsQuery,
} = adminRtkApi;
