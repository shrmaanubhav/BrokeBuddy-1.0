import { useState, useEffect, useCallback } from "react";
import { verifySession as verifySessionRequest } from "../services/authService";

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const verifySession = useCallback(async () => {
    try {
      const data = await verifySessionRequest();
      setUser(data);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  return {
    loading,
    isAuthenticated,
    setIsAuthenticated,
  };
}