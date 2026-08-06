import { Link } from "react-router-dom";

import "./LegalPage.css";

export default function LegalPage({ title, intro, sections }) {
  return (
    <div className="legal-page">
      <div className="legal-shell">
        <div className="legal-card">
          <div className="legal-topbar">
            <Link to="/" className="legal-back-link">
              ← Back to home
            </Link>
            <span className="legal-badge">BrokeBuddy</span>
          </div>

          <header className="legal-header">
            <div className="legal-logo">⚡</div>
            <div>
              <p className="legal-eyebrow">Policies & terms</p>
              <h1>{title}</h1>
            </div>
          </header>

          <p className="legal-intro">{intro}</p>

          <div className="legal-sections">
            {sections.map((section, index) => (
              <section key={section.title} className="legal-section">
                <h2>{`${index + 1}. ${section.title}`}</h2>
                <div className="legal-content">{section.content}</div>
              </section>
            ))}
          </div>

          <footer className="legal-footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
