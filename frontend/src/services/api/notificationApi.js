import api from "./client.js";

const fetchNotifications = async () => {
  const { data } = await api.get("/api/notifications");
  return data;
};

const markAsRead = async (id) => {
  const { data } = await api.patch(`/api/notifications/${id}/read`);
  return data;
};

const markAllAsRead = async () => {
  const { data } = await api.patch("/api/notifications/read-all");
  return data;
};

const deleteNotification = async (id) => {
  const { data } = await api.delete(`/api/notifications/${id}`);
  return data;
};

export default {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
