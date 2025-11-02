import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ExpensePage.css";
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
      alert(res.data.msg || "Logged out");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("name");
      clearCache();
      setIsAuthenticated(false);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      alert("Logout failed");
    }
  };

  const handleFetchData=async ()=>{
    if(isFetching) return;
    setIsFetching(true)
    try {
        const res = await fetch("http://localhost:4000/api/profile/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body:JSON.stringify({"email":userEmail})
        });

        if (!res.ok) {
          throw new Error("Could not fetch data");
        }
        alert("User Data Fetched!")
        
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
      finally{
        setIsFetching(false)
      }
  }


  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Please fill in all password fields.");
      return;
    }
    if (currentPassword === newPassword) {
      alert("New password cannot be the same as the current password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        alert("User not logged in.");
        return;
      }

      const res = await fetch("http://localhost:4000/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Failed to change password");
      }

      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangePassModalOpen(false);
    } catch (err) {
      console.error("Change Password Error:", err.message);
      alert(err.message || "Failed to change password");
    }
  };

  const handleChangeName = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert("Please enter a new name.");
      return;
    }
    try {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) {
        alert("User not logged in.");
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
      alert("Name changed successfully!");
      setNewName("");
      setIsChangeUserModalOpen(false);
    } catch (err) {
      console.error("Change Name Error:", err.message);
      alert(err.message || "Failed to change name");
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
        alert("User not logged in.");
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

      alert("Account deleted successfully.");
      localStorage.clear();
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      navigate("/login");
    } catch (err) {
      console.error("Delete Account Error:", err.message);
      alert(err.message || "Failed to delete account");
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
              <button className="btn btn-primary" onClick={handleFetchData} disabled={true} >Fetch Data</button>
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
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Save Password
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
            style={{ fontSize: "1.125rem", padding: "0.75rem 2rem",textDecoration:"none" }}
          >
            <Link to="/chatbot" style={{textDecoration:"none"}}>🧠 Start AI Analysis →</Link>
            
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
