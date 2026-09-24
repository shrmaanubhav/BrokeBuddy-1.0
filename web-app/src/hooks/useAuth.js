import { useState, useEffect, useCallback } from "react";

import { MOCK_USER } from "../dev/mockData/user";
import { isDevMode } from "../dev/mockMode";
import { verifySession as verifySessionRequest } from "../services/authService";

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const applyAuthState = useCallback((authenticated, nextUser = null) => {
    setUser(authenticated ? nextUser || MOCK_USER : null);
    setIsAuthenticated(authenticated);
  }, []);

  const verifySession = useCallback(async () => {
    if (isDevMode()) {
      applyAuthState(true, MOCK_USER);
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