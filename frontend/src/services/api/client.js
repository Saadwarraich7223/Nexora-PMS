import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, tokenRefreshed = false) => {
  pendingQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(tokenRefreshed);
    }
  });
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const isPublicAuthRoute =
      originalRequest?.url?.includes("/api/auth/login") ||
      originalRequest?.url?.includes("/api/auth/register") ||
      originalRequest?.url?.includes("/api/auth/refresh");

    if (isPublicAuthRoute) {
      return Promise.reject(error);
    }
    if (originalRequest?.url?.includes("/api/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/api/auth/refresh");
      processQueue(null, true);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, false);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
