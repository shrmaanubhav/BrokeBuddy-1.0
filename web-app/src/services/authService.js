import api from "../lib/api";

export const verifySession = async () => {
  const response = await api.get("/api/auth/checkAuth");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/api/auth/logout");
  return response.data;
};