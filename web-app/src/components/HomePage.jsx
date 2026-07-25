import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ExpensePage.css";
import toast from "react-hot-toast";
const HomePage = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userEmail = localStorage.getItem("userEmail") || "";

  const [isChangeUserModalOpen, setIsChangeUserModalOpen] = useState(false);
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/profile/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Could not fetch profile");
        }

        const userData = await res.json();
        setName(userData.name);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    if (userEmail) {
      fetchUserProfile();
    }
  }, [userEmail]);

  const clearCache = () => {
    localStorage.removeItem("cachedTransactions");
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
      const res = await axios.post("http://localhost:4000/api/auth/logout");
      toast.success(res.data.msg || "Logged out");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("name");
      clearCache();
      setIsAuthenticated(false);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      toast.error("Logout failed");
    }
  };

  const handleFetchData = async (e) => {
    e.preventDefault();
    setIsFetching(true);
    const toastId = toast.loading("Fetching user data...");
    console.log("Fetching user data...");

    try {
      const res = await fetch("http://localhost:4000/api/profile/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail }),
      });

      if (!res.ok) {
        throw new Error("Could not fetch data");
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    } finally {
      setIsFetching(false);
      toast.dismiss(toastId);
      toast.success("User Data Fetched!");
    }
  };

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [passwordValid, setPasswordValid] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    nospace: true,
  });

  const allValid = Object.values(passwordValid).every(Boolean);
  const passwordsMatch =
    newPassword && confirmNewPassword && newPassword === confirmNewPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as the current password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+\=\[\]{};:'",.<>\/?\\|`~])(?!.*\s).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
      toast.error(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character (no spaces)."
      );
      return;
    }

    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        toast.error("User not logged in.");
        return;
      }

      const res = await fetch("http://localhost:4000/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangePassModalOpen(false);
    } catch (err) {
      console.error("Change Password Error:", err.message);
      toast.error(err.message || "Failed to change password");
    }
  };

  const handleChangeName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Please enter a new name.");
      return;
    }
    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        toast.error("User not logged in.");
        return;
      }
      const res = await fetch("http://localhost:4000/api/profile/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          newName: newName.trim(),
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Failed to change name");
      }
      const data = await res.json();
      toast.success("Name changed successfully!");
      setNewName("");
      setIsChangeUserModalOpen(false);
    } catch (err) {
      console.error("Change Name Error:", err.message);
      toast.error(err.message || "Failed to change name");
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
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        toast.error("User not logged in.");
        return;
      }

      const res = await fetch("http://localhost:4000/api/profile/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Failed to delete account");
      }

      toast.success("Account deleted successfully.");
      localStorage.clear();
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      navigate("/login");
    } catch (err) {
      console.error("Delete Account Error:", err.message);
      toast.error(err.message || "Failed to delete account");
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
              <button
                className="btn btn-primary"
                style={{ padding: "11px" }}
                onClick={(e) => handleFetchData(e)}
                disabled={isFetching}
              >
                Fetch Data
              </button>
              <Link to="/chatbot" className="btn btn-primary nav-link-btn">
                {" "}
                {/* Use Link directly */}
                🤖 AI Assistant
              </Link>

              {/* --- Profile Section --- */}
              <div className="profile-section">
                <button
                  className="profile-button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {userEmail ? userEmail.substring(0, 1).toUpperCase() : "?"}
                </button>

                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      Signed in as <br />
                      <strong>{userEmail || "Not logged in"}</strong>
                    </div>
                    <ul className="dropdown-menu">
                      <li>
                        <button
                          onClick={() => {
                            setIsChangeUserModalOpen(true);
                            setIsProfileOpen(false);
                          }}
                        >
                          Change Username
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setIsChangePassModalOpen(true);
                            setIsProfileOpen(false);
                          }}
                        >
                          Change Password
                        </button>
                      </li>
                      <li>
                        <hr />
                      </li>
                      <li>
                        <button onClick={handleLogout}>Logout</button>
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

      {/* --- Change Username Modal --- */}
      {isChangeUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change Username</h2>
              <button
                onClick={() => setIsChangeUserModalOpen(false)}
                className="modal-close-btn"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleChangeName} className="modal-form">
              <div className="form-group">
                <label>New Username</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new username"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save Username
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangeUserModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Change Password Modal --- */}
      {isChangePassModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change Password</h2>
              <button
                onClick={() => setIsChangePassModalOpen(false)}
                className="modal-close-btn"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label>Current Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="form-input"
                  />
                  <span
                    className="toggle-password"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current,
                      })
                    }
                  >
                    {showPasswords.current ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);

                      // password validation
                      const val = e.target.value;
                      const checks = {
                        length: val.length >= 8,
                        upper: /[A-Z]/.test(val),
                        lower: /[a-z]/.test(val),
                        number: /\d/.test(val),
                        special:
                          /[!@#$%^&*()_\-+\=\[\]{};:'",.<>\/?\\|`~]/.test(val),
                        nospace: !/\s/.test(val),
                      };
                      setPasswordValid(checks);
                    }}
                    placeholder="Enter new password"
                    required
                    className="form-input"
                  />
                  <span
                    className="toggle-password"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                  >
                    {showPasswords.new ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              <ul className="password-criteria">
                <li className={passwordValid.length ? "valid" : ""}>
                  At least 8 characters
                </li>
                <li className={passwordValid.lower ? "valid" : ""}>
                  Contains a lowercase letter
                </li>
                <li className={passwordValid.upper ? "valid" : ""}>
                  Contains an uppercase letter
                </li>
                <li className={passwordValid.number ? "valid" : ""}>
                  Contains a number
                </li>
                <li className={passwordValid.special ? "valid" : ""}>
                  Contains a special character (!@#$%^&*)
                </li>
                <li className={passwordValid.nospace ? "valid" : ""}>
                  No spaces allowed
                </li>
              </ul>

              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="form-input"
                  />
                  <span
                    className="toggle-password"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                  >
                    {showPasswords.confirm ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              {!passwordsMatch && confirmNewPassword && (
                <p style={{ color: "red", fontSize: "0.9rem" }}>
                  ⚠️ Passwords do not match
                </p>
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!allValid || !passwordsMatch || loading}
                >
                  {loading ? "Saving..." : "Save Password"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangePassModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
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
            © 2025 InboxSpend. Powered by AI for smarter financial decisions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
