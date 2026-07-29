import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";
import "./Profile.css";

const Profile = ({ setIsAuthenticated }) => {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        setProfile({
          name: res.data?.name || "",
          email: res.data?.email || "",
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const clearCache = () => {
    localStorage.removeItem("transactions_cache");
    localStorage.removeItem("transactions_time");
  };

  const handleLogout = async () => {
    try {
      const res = await api.post("/auth/logout");
      toast.success(res.data.msg || "Logged out");
      clearCache();
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      navigate("/");
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      toast.error("Logout failed");
    }
  };

  return (
    <div className="container profile-page">
      <h1>Profile</h1>
      <p>
        Signed in as <strong>{profile.name || "Unknown user"}</strong>
      </p>
      {profile.email && <p>Email: {profile.email}</p>}
      <div className="profile-actions">
        <button className="btn btn-primary" onClick={() => navigate("/settings")}> 
          Go to Settings
        </button>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
