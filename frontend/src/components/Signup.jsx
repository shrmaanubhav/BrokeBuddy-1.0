import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./signup.css";
import toast from "react-hot-toast";

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

  const [passwordValid, setPasswordValid] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    nospace: true,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      const checks = {
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[!@#$%^&*()_\-+\=\[\]{};:'",.<>\/?\\|`~]/.test(value),
        nospace: !/\s/.test(value),
      };
      setPasswordValid(checks);
    }
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please enter your name and email first.");
      return;
    }

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
    if (!formData.otp) {
      toast.error("Please enter the OTP.");
      return;
    }

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
      if (!res.ok) throw new Error((await res.json()).msg || "Invalid OTP");
      toast.success("OTP verified successfully");
      setStep(3);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const completeSignup = async (e) => {
    e.preventDefault();
    const allValid = Object.values(passwordValid).every(Boolean);
    if (!allValid) {
      toast.error("Please create a strong password before continuing.");
      return;
    }

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
      if (!res.ok)
        throw new Error((await res.json()).msg || "Error completing signup");
      toast.success("User registered successfully!");
      setStep(1);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Error completing signup");
    } finally {
      setLoading(false);
    }
  };

  const allValid = Object.values(passwordValid).every(Boolean);

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-brand">
          <div className="signup-logo">₹</div>
        </div>

        <div className="signup-header">
          <h2 className="signup-title">Create Account</h2>
          <p className="signup-subtitle">
            Join us and start your financial journey
          </p>
        </div>

        <form className="signup-form">
          {step === 1 && (
            <>
              <div className="signup-group">
                <label className="signup-label">Full Name</label>
                <input
                  name="name"
                  type="text"
                  className="signup-input"
                  placeholder="Enter your name"
                  onChange={handleChange}
                   style={{ color: "" }}
                  required
                />
              </div>

              <div className="signup-group">
                <label className="signup-label">Email Address</label>
                <input
                  name="email"
                  type="email"
                  className="signup-input"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="signup-button"
                onClick={sendOTP}
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="signup-group">
                <label className="signup-label">Enter OTP</label>
                <input
                  name="otp"
                  type="text"
                  className="signup-input"
                  placeholder="Enter the OTP sent to your email"
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                className="signup-button"
                onClick={verifyOTP}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="signup-group">
                <label className="signup-label">Set Password</label>
                <div className="password-wrapper">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className="signup-input"
                    placeholder="Create your password"
                    onChange={handleChange}
                    required
                  />
                  <span
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
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

              <button
                className="signup-button"
                onClick={completeSignup}
                disabled={!allValid || loading}
              >
                {loading ? "Creating Account..." : "Complete Signup"}
              </button>
            </>
          )}
        </form>

        <div className="signup-link">
          Already have an account? <Link to="/">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
