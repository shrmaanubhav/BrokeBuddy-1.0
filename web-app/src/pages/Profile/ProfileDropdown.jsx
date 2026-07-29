import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";
import "./ProfileDropdown.css";

const ProfileDropdown = ({ setIsAuthenticated }) => {
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
    <div className="profile-section" ref={profileRef}>
      <button className="profile-button" onClick={() => setIsOpen(!isOpen)}>
        {name ? name.substring(0, 1).toUpperCase() : "?"}
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            Signed in as <br />
            <strong>{name || "Not logged in"}</strong>
          </div>
          <ul className="dropdown-menu">
            <li>
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                Profile
              </Link>
            </li>
            <li>
              <Link to="/settings" onClick={() => setIsOpen(false)}>
                Settings
              </Link>
            </li>
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
