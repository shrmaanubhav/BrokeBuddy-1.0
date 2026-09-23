import { useState, useEffect, useCallback } from "react";
import { verifySession as verifySessionRequest } from "../services/authService";

const DEV_USER = {
  name: "Test User",
  email: "test@brokebuddy.local",
};

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const applyAuthState = useCallback((authenticated, nextUser = null) => {
    setUser(authenticated ? nextUser || DEV_USER : null);
    setIsAuthenticated(authenticated);
  }, []);

  const verifySession = useCallback(async () => {
    const isDevMode =
      typeof window !== "undefined" && window.__BROKEBUDDY_DEV_MODE__ === true;

    if (isDevMode) {
      applyAuthState(true, DEV_USER);
      setLoading(false);
      return;
    }

    try {
      const data = await verifySessionRequest();
      applyAuthState(true, data);
    } catch {
      applyAuthState(false);
    } finally {
      setLoading(false);
    }
  }, [applyAuthState]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  return {
    loading,
    isAuthenticated,
    user,
    setIsAuthenticated,
  };
}