import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import HomePage from "../pages/Dashboard/Dashboard";
import ExpensesPage from "../pages/Expenses/Expenses";
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
            <HomePage user={user} setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <Login />
          )
        }
      />

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route
          path="/homepage"
          element={<HomePage user={user} setIsAuthenticated={setIsAuthenticated} />}
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
