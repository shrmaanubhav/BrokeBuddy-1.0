import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const BASE_URL = "http://localhost:4000/api/auth";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const sendOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/sendOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!res.ok)
        throw new Error((await res.json()).msg || "Error sending OTP");
      alert("OTP sent to your email");
      setStep(2);
    } catch (err) {
      alert(err.message || "Error sending OTP");
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/verifyOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, OTP: otp }),
      });
      if (!res.ok) throw new Error((await res.json()).msg || "Invalid OTP");
      alert("OTP verified successfully");
      setStep(3);
    } catch (err) {
      alert(err.message || "Invalid OTP");
    }
  };

  const resetPass = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/resetPass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, newPass }),
      });
      if (!res.ok)
        throw new Error((await res.json()).msg || "Failed to reset password");
      alert("Password reset successfully");
      setStep(1);
    } catch (err) {
      alert(err.message || "Failed to reset password");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const userData = await res.json();
      if (!res.ok) {
        throw new Error(userData.msg || "Login failed");
      }
      localStorage.setItem("userEmail", userData.email);
      localStorage.setItem("name", userData.name);

      setIsAuthenticated?.(true);
      navigate("/homepage");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (step === 1) handleSubmit(e);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">⚡</div>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in or reset your password easily</p>

        <form className="login-form" onSubmit={handleFormSubmit}>
          {step === 1 && (
            <>
              <div className="login-group">
                <label className="login-label">Email</label>
                <input
                  name="email"
                  type="email"
                  className="login-input"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-group">
                <label className="login-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="login-input"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="login-button">
                Login
              </button>

              <button type="button" className="login-button" onClick={sendOTP}>
                Forgot Password
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="login-group">
                <label className="login-label">Enter OTP</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder="Enter OTP sent to your email"
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <button
                className="login-button"
                type="button"
                onClick={verifyOTP}
              >
                Verify OTP
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="login-group">
                <label className="login-label">New Password</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter new password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>
              <button
                className="login-button"
                type="button"
                onClick={resetPass}
              >
                Reset Password
              </button>
            </>
          )}
        </form>

        <div className="login-link">
          Don't have an account? <Link to="/signup">Signup here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
