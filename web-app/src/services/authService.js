import api from "../lib/api";

export const verifySession = async () => {
  const response = await api.get("/auth/checkAuth");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};