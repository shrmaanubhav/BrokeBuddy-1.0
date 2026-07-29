import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";
import "./Settings.css";

const Settings = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

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
      toast.error(err.response?.data?.msg || err.message || "Failed to delete account");
    }
  };

  return (
    <div className="settings-page">
      <div className="container">
        <h1>Settings</h1>
        <p>Manage your account and security settings.</p>
        <div className="settings-actions">
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            className="btn btn-secondary delete-link"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
