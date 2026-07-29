import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../lib/api";
import "./Dashboard.css";
import ProfileDropdown from "../Profile/ProfileDropdown";
import toast from "react-hot-toast";

const Dashboard = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [isFetching, setIsFetching] = useState(false);


  const handleSyncTransactions = async (e) => {
    e.preventDefault();
    setIsFetching(true);
    const toastId = toast.loading("Syncing transactions...");

    try {
      const res = await api.post("/profile/sync-transactions");
      toast.success(
        res.data.msg || "Transactions synced successfully!"
      );
      notifyTransactionsRefreshed();
    } catch (error) {
      console.error("Failed to sync transactions", error);
      toast.error("Failed to sync transactions");
    } finally {
      setIsFetching(false);
      toast.dismiss(toastId);
    }
  };

  const notifyTransactionsRefreshed = () => {
    const event = new Event("transactionsRefreshed");
    window.dispatchEvent(event);
  };


  return (
    <div>
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="logo">
              ⚡ BrokeBuddy
            </Link>
            <div className="nav-links">
              <Link to="/expenses" className="btn btn-primary nav-link-btn">
                Expenses
              </Link>
              <button
                className="btn btn-primary"
                style={{ padding: "11px" }}
                onClick={handleSyncTransactions}
                disabled={isFetching}
              >
                {isFetching ? "Syncing..." : "🔄 Sync Transactions"}
              </button>
              <Link to="/chatbot" className="btn btn-primary nav-link-btn">
                🤖 AI Assistant
              </Link>

              {/* --- Profile Section --- */}
              <ProfileDropdown setIsAuthenticated={setIsAuthenticated} />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-icon">⚡</div>
          <h1>BrokeBuddy</h1>
          <p>AI-powered financial insights from your email transactions</p>

          <h5>Welcome, {name || "Buddy"}</h5>

          <button
            className="btn btn-primary nav-link-btn"
            style={{
              fontSize: "1.125rem",
              padding: "0.75rem 2rem",
              textDecoration: "none",
            }}
          >
            <Link to="/chatbot" style={{ textDecoration: "none" }}>
              🧠 Start AI Analysis →
            </Link>
          </button>

          {/* Feature Cards */}
          <div className="features">
            <div className="feature-card">
              <div className="feature-icon purple">🤖</div>
              <h3>AI Assistant</h3>
              <p>
                Get personalized insights from your email transactions using
                advanced AI
              </p>
            </div>

            <Link to="/expenses" className="feature-card">
              <div className="feature-icon blue">📊</div>
              <h3>Expense Tracker</h3>
              <p>
                Track and categorize your spending with intelligent automation
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #333",
          padding: "2rem 0",
          textAlign: "center",
        }}
      >
        <div className="container">
          <p style={{ color: "#666" }}>
            © 2025 BrokeBuddy. Powered by AI for smarter financial decisions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
