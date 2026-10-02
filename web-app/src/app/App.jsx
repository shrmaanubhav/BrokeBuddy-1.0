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
