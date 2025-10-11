import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import axios from "axios";

// Import all your components
import HomePage from "./components/HomePage";
import ExpensesPage from "./components/ExpensesPage";
import Login from "./components/Login";
import Signup from "./components/Signup";

// Global Axios Configuration (Crucial for sending session cookies)
axios.defaults.baseURL = "http://localhost:4000/api/auth";
axios.defaults.withCredentials = true;

// 1. Inline ProtectedRoute Component
const ProtectedRoute = ({ isAuthenticated }) => {
  // Unauthenticated users are sent to the explicit /login path
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // State for session persistence

  // 2. Session Persistence Logic (The Final Fix)
  const checkAuthStatus = async () => {
    try {
      // Call the existing backend route that checks the cookie
      await axios.get("/checkAuth");
      setIsAuthenticated(true);
    } catch (error) {
      // If the token is invalid or missing (401/403), set to false
      setIsAuthenticated(false);
    } finally {
      // Stop loading after the check is complete
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Block rendering the main app until the status is known
  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Verifying session...
      </div>
    );
  }

  // 3. Final Routing Structure
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          {/* Use /login as the explicit login path */}
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="/signup" element={<Signup />} />

          {/* Single Protected Routes Group */}
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            {/* The root path (/) is the default protected landing page */}
            <Route
              path="/"
              element={<HomePage setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/homepage"
              element={<HomePage setIsAuthenticated={setIsAuthenticated} />}
            />
            <Route
              path="/expenses"
              element={<ExpensesPage setIsAuthenticated={setIsAuthenticated} />}
            />
          </Route>

          {/* Catch-all route: Ensures navigation lands correctly */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
