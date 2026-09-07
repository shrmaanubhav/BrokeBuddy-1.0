import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import "./LegalPage.css";

export default function LegalPage({ title, lastUpdated = "July 2026", sections }) {
  const [activeSection, setActiveSection] = useState(0);
  const location = useLocation();

  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(`legal-sec-${i}`);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(i);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (e, index) => {
    e.preventDefault();
    setActiveSection(index);
    const element = document.getElementById(`legal-sec-${index}`);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="legal-page">
      {/* BrokeBuddy Standard Navigation Header */}
      <header className="landing-header">
        <div className="header-container">
          <Link to="/" className="header-brand" style={{ textDecoration: "none" }}>
            <div className="brand-logo-box">
              <img src={logoImg} alt="BrokeBuddy Logo" className="brand-logo-img" />
            </div>
            <span className="brand-title">BrokeBuddy</span>
          </Link>

          <nav className="header-nav">
            <span className="nav-divider">|</span>
            <Link
              to="/privacy"
              className={`nav-link ${location.pathname === "/privacy" ? "active-page" : ""}`}
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className={`nav-link ${location.pathname === "/terms" ? "active-page" : ""}`}
            >
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

      {/* Main Content Area */}
      <main className="legal-main">
        <div className="legal-container">
          {/* Header Title Section */}
          <div className="legal-hero-header">
            <Link to="/" className="legal-back-home-link">
              ← Back to Home
            </Link>
            <h1 className="legal-page-title">{title}</h1>
            <p className="legal-last-updated">Last updated: {lastUpdated}</p>
          </div>

          {/* Two-Column Documentation Grid */}
          <div className="legal-doc-grid">
            {/* Left Column: Sticky Sidebar Nav */}
            <aside className="legal-sidebar">
              <nav className="legal-sidebar-nav">
                {sections.map((sec, index) => (
                  <a
                    key={sec.title}
                    href={`#legal-sec-${index}`}
                    className={`legal-sidebar-link ${
                      activeSection === index ? "active" : ""
                    }`}
                    onClick={(e) => scrollToSection(e, index)}
                  >
                    <span className="sidebar-sec-num">{index + 1}.</span>
                    <span className="sidebar-sec-title">{sec.title}</span>
                  </a>
                ))}
              </nav>
            </aside>

            {/* Vertical Divider Line */}
            <div className="legal-grid-divider" aria-hidden="true" />

            {/* Right Column: Legal Content */}
            <article className="legal-content-body">
              {sections.map((sec, index) => (
                <section
                  key={sec.title}
                  id={`legal-sec-${index}`}
                  className="legal-section-block"
                >
                  <h2 className="legal-section-title">
                    {index + 1}. {sec.title}
                  </h2>
                  <div className="legal-section-content">{sec.content}</div>
                </section>
              ))}
            </article>
          </div>
        </div>
      </main>

      {/* BrokeBuddy Standard Footer */}
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
            <a href="mailto:brokebuddy.support@gmail.com" className="footer-link">
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
