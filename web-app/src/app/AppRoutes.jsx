import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/Dashboard/Dashboard";
import ExpensesPage from "../pages/Expenses/Expenses";
import Login from "../pages/Landing/Login";
import ChatBot from "../pages/Chat/Chat";
import PrivacyPolicy from "../pages/Legal/PrivacyPolicy";
import TermsOfService from "../pages/Legal/TermsOfService";

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

      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

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

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
