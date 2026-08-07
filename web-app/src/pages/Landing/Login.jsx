import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Wallet2,
} from "lucide-react";

import "./Login.css";

const features = [
  {
    icon: MailCheck,
    title: "Automatic Gmail syncing",
    description: "Import transaction confirmation emails without lifting a finger.",
  },
  {
    icon: BrainCircuit,
    title: "AI expense categorization",
    description: "Turn messy receipts and bank emails into organized spending data.",
  },
  {
    icon: BarChart3,
    title: "Spending analytics",
    description: "Understand where your money goes with clear, actionable insights.",
  },
  {
    icon: Wallet2,
    title: "Budget management",
    description: "Stay on top of your plans with smart budgeting tools and alerts.",
  },
];

const trustBadges = [
  "Google OAuth Authentication",
  "Read-only Gmail Access",
  "Secure & Encrypted",
];

const Login = () => {
  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <div className="login-page">
      <div className="login-background" aria-hidden="true">
        <div className="bg-orb orb-one" />
        <div className="bg-orb orb-two" />
        <div className="bg-grid" />
      </div>

      <main className="login-shell" role="main">
        <section className="landing-panel" aria-labelledby="landing-title">
          <div className="landing-top">
            <div className="brand-badge">
              <Sparkles size={18} />
            </div>
            <span className="eyebrow">AI finance operating system</span>
          </div>

          <div className="hero-copy-block">
            <div className="hero-logo" aria-hidden="true">
              ⚡
            </div>
            <h1 id="landing-title">BrokeBuddy</h1>
            <p className="hero-lead">Your AI-powered personal finance assistant.</p>
            <p className="hero-description">
              Securely sync bank transaction emails, automatically categorize
              expenses, analyze spending, and manage your budget—all from one
              place.
            </p>
          </div>

          <div className="feature-grid" aria-label="BrokeBuddy features">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article className="feature-card" key={feature.title} style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="feature-icon">
                    <Icon size={18} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>

          <section className="info-card" aria-labelledby="gmail-access-title">
            <div className="info-card-header">
              <ShieldCheck size={20} />
              <h2 id="gmail-access-title">Why Gmail access?</h2>
            </div>
            <p>
              BrokeBuddy only accesses bank transaction confirmation emails to
              automatically import expenses. Personal emails unrelated to
              financial transactions are never stored or processed.
            </p>
          </section>
        </section>

        <aside className="auth-panel">
          <div className="auth-stage">
            <div className="auth-decor decor-one" />
            <div className="auth-decor decor-two" />

            <div className="dashboard-preview auth-preview" aria-hidden="true">
              <div className="browser-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="preview-metric large">
                    <span>Monthly spend</span>
                    <strong>$2,480</strong>
                  </div>
                  <div className="preview-metric">
                    <span>Budget left</span>
                    <strong>$720</strong>
                  </div>
                  <div className="preview-metric">
                    <span>Auto-categorized</span>
                    <strong>184</strong>
                  </div>
                </div>
                <div className="preview-main">
                  <div className="chart-card" />
                  <div className="mini-cards">
                    <div className="mini-card" />
                    <div className="mini-card" />
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-card">
              <div className="trust-badge">
                <Sparkles size={15} />
                Trusted for secure AI-powered expense tracking
              </div>

              <div className="auth-logo" aria-hidden="true">
                ⚡
              </div>
              <p className="auth-kicker">Private and secure</p>
              <h2>Welcome to BrokeBuddy</h2>
              <p className="auth-subtitle">Sign in to continue.</p>

              <button type="button" className="login-button" onClick={handleGoogleLogin}>
                <span className="google-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img" aria-label="Google logo">
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
                Continue with Google
                <ArrowRight size={18} />
              </button>

              <div className="auth-trust-block" aria-label="Trust indicators">
                {trustBadges.map((badge) => (
                  <div className="trust-chip" key={badge}>
                    <CheckCircle2 size={15} />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>

              <div className="auth-footer-links">
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
                <a href="mailto:hello@brokebuddy.app">Contact</a>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Login;
