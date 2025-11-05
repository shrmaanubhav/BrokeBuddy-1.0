import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./login.css";
import toast from "react-hot-toast";

function Login({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    login: false,
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

  const BASE_URL = "http://localhost:4000/api/auth";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/sendOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!res.ok)
        throw new Error((await res.json()).msg || "Error sending OTP");
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/verifyOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, OTP: otp }),
      });
      if (!res.ok) throw new Error((await res.json()).msg || "Invalid OTP");
      toast.success("OTP verified successfully");
      setStep(3);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassChange = (e) => {
    const value = e.target.value;
    setNewPass(value);
    const checks = {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /\d/.test(value),
      special: /[!@#$%^&*()_\-+\=\[\]{};:'",.<>\/?\\|`~]/.test(value),
      nospace: !/\s/.test(value),
    };
    setPasswordValid(checks);
  };

  const allValid = Object.values(passwordValid).every(Boolean);
  const passwordsMatch = newPass && confirmPass && newPass === confirmPass;

  const resetPass = async (e) => {
    e.preventDefault();
    if (!allValid) {
      toast.error("Please create a strong password that meets all criteria.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/resetPass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, newPass }),
      });
      if (!res.ok)
        throw new Error((await res.json()).msg || "Failed to reset password");
      toast.success("Password reset successfully");
      setNewPass("");
      setConfirmPass("");
      setStep(1);
    } catch (err) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      toast.success("Login successful");
      navigate("/homepage");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">⚡</div>
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Sign in or reset your password easily</p>

        <form className="login-form" onSubmit={handleSubmit}>
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
                <div className="password-wrapper">
                  <input
                    name="password"
                    type={showPasswords.login ? "text" : "password"}
                    className="login-input"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        login: !showPasswords.login,
                      })
                    }
                  >
                    {showPasswords.login ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>

              <button
                type="button"
                className="login-button"
                onClick={sendOTP}
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Forgot Password"}
              </button>
            </>
          )}

          {/* Step 2: OTP Verification */}
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
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <>
              <div className="login-group">
                <label className="login-label">New Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="login-input"
                    placeholder="Enter new password"
                    value={newPass}
                    onChange={handleNewPassChange}
                    required
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

              <div className="login-group">
                <label className="login-label">Confirm Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="login-input"
                    placeholder="Confirm new password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
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

              {!passwordsMatch && confirmPass && (
                <p style={{ color: "red", fontSize: "0.9rem" }}>
                  ⚠️ Passwords do not match
                </p>
              )}

              <button
                className="login-button"
                type="button"
                onClick={resetPass}
                disabled={!allValid || !passwordsMatch || loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
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
