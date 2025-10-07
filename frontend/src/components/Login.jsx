"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:4000/api/auth";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1 — Send OTP (Forgot Password)
  const sendOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/sendOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Error sending OTP");
      }

      alert("OTP sent to your email");
      setStep(2);
    } catch (err) {
      console.error(err.message);
      alert(err.message || "Error sending OTP");
    }
  };

  // Step 2 — Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/verifyOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, OTP: otp }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Invalid OTP");
      }

      alert("OTP verified successfully");
      setStep(3);
    } catch (err) {
      console.error(err.message);
      alert(err.message || "Invalid OTP");
    }
  };

  // Step 3 — Reset Password
  const resetpass = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/resetPass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, newPass }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Failed to reset password");
      }

      alert("Password reset successfully");
      setStep(1);
    } catch (err) {
      console.error(err.message);
      alert(err.message || "Failed to reset password");
    }
  };

  // Step 1 — Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Login failed");
      }

      const data = await res.json();
    //   alert(data.msg || "Login successful");
      setIsLoggedIn(true);
      navigate("/homepage");

    } catch (err) {
      console.error(err.message);
      alert(err.message || "Login failed");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/logout`, { method: "POST" });

      if (!res.ok) {
        throw new Error("Logout failed");
      }

      const data = await res.json();
      alert(data.msg || "Logged out successfully");
      setIsLoggedIn(false);
    } catch (err) {
      console.error(err.message);
      alert(err.message || "Logout failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-logo">⚡</div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in or reset your password easily</p>

        <form className="auth-form">
          {/* Step 1: Login */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="submit-button" onClick={handleSubmit}>
                Login
              </button>

              <button className="submit-button" onClick={sendOTP}>
                Forgot Password
              </button>

              {isLoggedIn && (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              )}
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <input
                  type="text"
                  name="otp"
                  className="form-input"
                  placeholder="Enter the OTP sent to your email"
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              <button className="submit-button" onClick={verifyOTP}>
                Verify OTP
              </button>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="newPass"
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                />
              </div>

              <button className="submit-button" onClick={resetpass}>
                Reset Password
              </button>
            </>
          )}
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/signup">Signup here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
