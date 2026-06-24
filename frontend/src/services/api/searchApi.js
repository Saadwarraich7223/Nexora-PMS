import api from "./client.js";

/**
 * Global search API service.
 */
const globalSearch = async (query) => {
  if (!query || query.trim().length < 2) return null;
  const { data } = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
  return data.data;
};

export default {
  globalSearch
};
