import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  EyeOff,
  Lock,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import logoImg from "../../assets/logo.png";
import "./Login.css";

const productFeatures = [
  {
    icon: MailCheck,
    iconClass: "blue",
    title: "Automatic Transaction Tracking",
    description:
      "Import transaction confirmations from Gmail automatically.",
  },
  {
    icon: BarChart3,
    iconClass: "indigo",
    title: "Spending Insights",
    description:
      "Understand your spending habits with clear visual insights.",
  },
  {
    icon: Sparkles,
    iconClass: "purple",
    title: "AI Financial Assistant",
    description:
      "Ask questions about your finances and get personalized guidance.",
  },
];

// const securityBadges = [
//   {
//     icon: ShieldCheck,
//     title: "Read-only access",
//     description: "We only read your emails",
//   },
//   {
//     icon: EyeOff,
//     title: "No modification",
//     description: "We don't send, delete or change emails",
//   },
//   {
//     icon: Lock,
//     title: "Your data stays yours",
//     description: "You can disconnect anytime",
//   },
// ];

const Login = () => {
  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="header-container">
          <div className="header-brand">
            <div className="brand-logo-box">
              <img src={logoImg} alt="BrokeBuddy Logo" className="brand-logo-img" />
            </div>
            <span className="brand-title">BrokeBuddy</span>
          </div>

          <nav className="header-nav">
            {/* <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#security" className="nav-link">
              How it works
            </a>
            <a href="#security" className="nav-link">
              FAQ
            </a> */}
            <span className="nav-divider">|</span>
            <Link to="/privacy" className="nav-link">
              Privacy
            </Link>
            <Link to="/terms" className="nav-link">
              Terms
            </Link>
            <span className="nav-divider">|</span>
            <button
              type="button"
              className="header-cta-btn"
              onClick={handleGoogleLogin}
            >
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main className="landing-content">
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-brand-lockup">
            <img src={logoImg} alt="BrokeBuddy Logo" className="hero-brand-icon" />
            <span className="hero-brand-text">
              <span className="brand-broke">Broke</span>
              <span className="brand-buddy">Buddy</span>
            </span>
          </div>

          <h1 className="hero-headline">
            Your personal financial assistant.
          </h1>

          <p className="hero-subtext">
            Turn your transaction emails into clear insights, track your spending,
            manage your budget, and get personalized guidance with AI.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="google-cta-button"
              onClick={handleGoogleLogin}
              id="main-google-login-btn"
            >
              <span className="google-icon-svg" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M21.6 12.23c0-.79-.07-1.54-.2-2.27H12v4.3h5.39a4.61 4.61 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.99-4.33 2.99-7.56Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 22c2.7 0 4.96-.89 6.62-2.41l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H2.98v2.58A10 10 0 0 0 12 22Z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.41 13.93A5.99 5.99 0 0 1 6.41 10.07V7.49H3.17a10 10 0 0 0 0 12.88l3.24-2.58Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 6.04c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.99 14.7 2 12 2A10 10 0 0 0 3.17 7.49l3.24 2.58C7.2 7.8 9.4 6.04 12 6.04Z"
                    fill="#EA4335"
                  />
                </svg>
              </span>
              <span>Continue with Google</span>
              <ArrowRight size={16} className="btn-arrow" />
            </button>

            <div className="hero-security-note">
              <Lock size={13} className="lock-icon" />
              <span>Read-only Gmail access &bull; Secure & private</span>
            </div>
          </div>
        </section>

        {/* 3 FEATURE CARDS */}
        <section className="features-section" id="features">
          <div className="features-grid">
            {productFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div className="feature-card" key={feature.title}>
                  <div className={`feature-icon-box ${feature.iconClass}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-desc">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECURITY & TRUST SECTION */}
        <section className="security-section" id="security">
          <div className="security-divider">
            <span className="divider-line" />
            <h2 className="security-heading">
              Trusted, secure, and built for your privacy
            </h2>
            <span className="divider-line" />
          </div>

          {/* <div className="security-grid">
            {securityBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div className="security-card" key={badge.title}>
                  <div className="security-card-icon">
                    <Icon size={18} />
                  </div>
                  <div className="security-card-content">
                    <h4 className="security-card-title">{badge.title}</h4>
                    <p className="security-card-desc">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div> */}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} BrokeBuddy. All rights reserved.
          </div>

          <nav className="footer-links">
            <Link to="/privacy" className="footer-link">
              Privacy Policy
            </Link>
            <span className="footer-separator">&bull;</span>
            <Link to="/terms" className="footer-link">
              Terms of Service
            </Link>
            <span className="footer-separator">&bull;</span>
            <a href="mailto:hello@brokebuddy.app" className="footer-link">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Login;
