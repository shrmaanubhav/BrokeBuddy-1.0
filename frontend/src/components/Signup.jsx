import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signup.css";

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1 - Send OTP
  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/sendOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
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
    } finally {
      setLoading(false);
    }
  };

  // Step 2 - Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/verifyOTP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          OTP: formData.otp,
        }),
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
    } finally {
      setLoading(false);
    }
  };

  // Step 3 - Complete Signup
  const completeSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || "Error completing signup");
      }

      alert("User registered successfully!");
      setStep(1);
      navigate("/");
    } catch (err) {
      console.error(err.message);
      alert(err.message || "Error completing signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="brand-section">
          <div className="brand-logo">₹</div>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">
            Join us and start your financial journey
          </p>
        </div>

        <form className="auth-form">
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Enter your name"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="submit-button"
                onClick={sendOTP}
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <input
                  name="otp"
                  type="text"
                  className="form-input"
                  placeholder="Enter the OTP sent to your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="submit-button"
                onClick={verifyOTP}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label className="form-label">Set Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Create your password"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="submit-button"
                onClick={completeSignup}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Complete Signup"}
              </button>
            </>
          )}
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
