import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../lib/api";
import "../Expenses/Expenses.css";
import toast from "react-hot-toast";
import BankEmailModal from "../../components/BankEmailModal";

const Dashboard = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bankSenderEmail, setBankSenderEmail] = useState("");
  const [bankSenderVerified, setBankSenderVerified] = useState(false);
  const [isBankEmailModalOpen, setIsBankEmailModalOpen] = useState(false);
  const [isSavingBankEmail, setIsSavingBankEmail] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        setName(res.data?.name || "");
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const clearCache = () => {
    localStorage.removeItem("transactions_cache");
    localStorage.removeItem("transactions_time");
    console.log("✅ Cache cleared on logout");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest(".profile-section")) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLogout = async () => {
    try {
      const res = await api.post("/auth/logout");
      toast.success(res.data.msg || "Logged out");
      clearCache();
      setIsAuthenticated(false);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      toast.error("Logout failed");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (
      !window.confirm(
        "Do you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete("/profile/account");
      toast.success("Account deleted successfully.");
      localStorage.clear();
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      navigate("/");
    } catch (err) {
      console.error("Delete Account Error:", err.response?.data?.msg || err.message);
      toast.error(
        err.response?.data?.msg || err.message || "Failed to delete account"
      );
    }
  };

  const fetchBankSenderEmail = async () => {
    try {
      const response = await api.get("/user/bank-email");
      setBankSenderEmail(response.data?.bankSenderEmail || "");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      return response.data?.bankSenderEmail || "";
    } catch (err) {
      console.error("Failed to load bank sender email:", err);
      return "";
    }
  };

  const handleOpenBankEmailModal = async () => {
    await fetchBankSenderEmail();
    setIsBankEmailModalOpen(true);
  };

  const handleSaveBankEmail = async (email) => {
    setIsSavingBankEmail(true);

    try {
      const response = await api.put("/user/bank-email", {
        bankSenderEmail: email,
      });

      setBankSenderEmail(response.data?.bankSenderEmail || "");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      toast.success("Bank sender email updated successfully.");
      setIsBankEmailModalOpen(false);
    } catch (err) {
      console.error("Failed to save bank sender email:", err);
      toast.error(
        err.response?.data?.msg || err.message || "Failed to save bank sender email"
      );
    } finally {
      setIsSavingBankEmail(false);
    }
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
              <Link to="/chatbot" className="btn btn-primary nav-link-btn">
                🤖 AI Assistant
              </Link>

              {/* --- Profile Section --- */}
              <div className="profile-section">
                <button
                  className="profile-button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {name ? name.substring(0, 1).toUpperCase() : "?"}
                </button>

                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      Signed in as <br />
                      <strong>{name || "Not logged in"}</strong>
                    </div>
                    <ul className="dropdown-menu">
                      <li>
                        <button onClick={handleLogout}>Logout</button>
                      </li>
                      <li>
                        <button onClick={handleOpenBankEmailModal}>
                          Edit Bank Sender Email
                        </button>
                      </li>
                      <li>
                        <hr />
                      </li>
                      <li>
                        <button
                          onClick={handleDeleteAccount}
                          className="delete-link"
                        >
                          Delete Account
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isBankEmailModalOpen && (
        <BankEmailModal
          isOpen={isBankEmailModalOpen}
          initialValue={bankSenderEmail}
          title="Edit Bank Sender Email"
          placeholder="alerts@hdfcbank.net"
          onClose={() => setIsBankEmailModalOpen(false)}
          onSave={handleSaveBankEmail}
          isSaving={isSavingBankEmail}
        />
      )}

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
