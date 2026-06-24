import api from "./client.js";

const login = async (payload) => {
  const { data } = await api.post("/api/auth/login", payload);
  return data.user;
};

const register = async (payload) => {
  const { data } = await api.post("/api/auth/register", payload);
  return data;
};

const logout = async () => {
  await api.post("/api/auth/logout");
};

const me = async () => {
  const { data } = await api.get("/api/users/me");
  return data.user;
};

const changePassword = async (payload) => {
  const { data } = await api.post("/api/auth/change-password", payload);
  return data;
};

export default { login, register, logout, me, changePassword };

