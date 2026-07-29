import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/Dashboard/Dashboard";
import ExpensesPage from "../pages/Expenses/Expenses";
import ProfilePage from "../pages/Profile/Profile";
import SettingsPage from "../pages/Settings/Settings";
import Login from "../pages/Landing/Login";
import ChatBot from "../pages/Chat/Chat";

export default function AppRoutes({
  isAuthenticated,
  user,
  setIsAuthenticated,
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Dashboard user={user} setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <Login />
          )
        }
      />

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route
          path="/dashboard"
          element={<Dashboard user={user} setIsAuthenticated={setIsAuthenticated} />}
        />

        <Route
          path="/expenses"
          element={<ExpensesPage setIsAuthenticated={setIsAuthenticated} />}
        />

        <Route
          path="/chatbot"
          element={<ChatBot setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route
          path="/profile"
          element={<ProfilePage setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route
          path="/settings"
          element={<SettingsPage setIsAuthenticated={setIsAuthenticated} />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
