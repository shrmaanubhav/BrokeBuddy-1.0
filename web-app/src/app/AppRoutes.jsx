import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import HomePage from "../pages/Dashboard/Dashboard";
import ExpensesPage from "../pages/Expenses/Expenses";
import Login from "../pages/Landing/Login";
import Signup from "../pages/Landing/Signup";
import ChatBot from "../pages/Chat/Chat";

export default function AppRoutes({
  isAuthenticated,
  setIsAuthenticated,
}) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={<Login setIsAuthenticated={setIsAuthenticated} />}
      />

      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
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

        <Route
          path="/chatbot"
          element={<ChatBot setIsAuthenticated={setIsAuthenticated} />}
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}