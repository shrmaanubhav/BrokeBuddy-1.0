import { BrowserRouter as Router, useLocation } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import AppRoutes from "./AppRoutes";
import AppToaster from "./AppToaster";
import BudAssistant from "../components/BudAssistant";
import GlobalNavbar from "../components/GlobalNavbar";

const getCurrentPage = (pathname) => {
  if (pathname.startsWith("/expenses")) return "expenses";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/chatbot")) return "chatbot";
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/transactions")) return "transactions";
  if (pathname === "/") return "dashboard";
  return "dashboard";
};

function AppShell({ isAuthenticated, user, setIsAuthenticated }) {
  const location = useLocation();
  const currentPage = getCurrentPage(location.pathname);
  const shouldHideFloatingBud = currentPage === "chatbot";

  return (
    <>
      <style>{`
        html, body, #root {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(15, 23, 42, 0.28);
          background: #070b14;
        }

        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.6) rgba(15, 23, 42, 0.28);
        }

        *::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        *::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.28);
        }

        *::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.6);
          border-radius: 999px;
          border: 2px solid rgba(15, 23, 42, 0.3);
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 82px 24px 24px;
          background: rgba(2, 6, 23, 0.72);
          box-sizing: border-box;
        }

        .modal-content {
          width: min(520px, calc(100vw - 48px));
          max-height: calc(100vh - 108px);
          overflow: auto;
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 18px;
          box-shadow: 0 24px 50px rgba(2, 6, 23, 0.5);
          padding: 1.1rem 1.1rem 1.2rem;
          color: #f8fafc;
          box-sizing: border-box;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .modal-header h2 {
          margin: 0;
          color: #f8fafc;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .modal-close-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.7);
          color: #cbd5e1;
          font-size: 1.5rem;
          line-height: 1;
          padding: 0;
          margin: 0;
          cursor: pointer;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          color: #dfe7f3;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.7);
          color: #f8fafc;
          padding: 0.8rem 0.85rem;
          font: inherit;
          font-size: 0.94rem;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          border-color: rgba(96, 165, 250, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .form-error {
          margin: 0;
          color: #fca5a5;
          font-size: 0.75rem;
          line-height: 1.4;
        }

        .form-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .btn {
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.7);
          color: #e2e8f0;
          padding: 0.72rem 1rem;
          font: inherit;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn-primary {
          border-color: transparent;
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          color: #fff;
          box-shadow: 0 10px 18px rgba(96, 165, 250, 0.2);
        }

        .btn-outline {
          background: rgba(15, 23, 42, 0.78);
          border-color: rgba(148, 163, 184, 0.22);
          color: #e2e8f0;
        }
      `}</style>

      <div
        className="app-shell"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          minHeight: "100vh",
        }}
      >
        <AppToaster />

      {isAuthenticated && (
        <GlobalNavbar user={user} setIsAuthenticated={setIsAuthenticated} />
      )}

      <div className="app-shell__content" style={{ flex: 1, minHeight: 0 }}>
        <AppRoutes
          isAuthenticated={isAuthenticated}
          user={user}
          setIsAuthenticated={setIsAuthenticated}
        />
      </div>

        {isAuthenticated && !shouldHideFloatingBud && (
          <BudAssistant currentPage={currentPage} isAuthenticated={isAuthenticated} />
        )}
      </div>
    </>
  );
}

function App() {
  const { loading, isAuthenticated, user, setIsAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        Verifying session...
      </div>
    );
  }

  return (
    <Router>
      <AppShell
        isAuthenticated={isAuthenticated}
        user={user}
        setIsAuthenticated={setIsAuthenticated}
      />
    </Router>
  );
}

export default App;
