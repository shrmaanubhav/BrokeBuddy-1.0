import { Link } from "react-router-dom"
import './ExpensePage.css';
const HomePage = () => {
    return (
        <div>
            {/* Navigation */}
            <nav className="nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="logo">
                            ⚡ InboxSpend
                        </Link>
                        <div className="nav-links">
                            <Link to="/expenses" className="nav-link">
                                Expenses
                            </Link>
                            <button className="btn btn-primary">🤖 AI Assistant</button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-icon">⚡</div>
                    <h1>InboxSpend</h1>
                    <p>AI-powered financial insights from your email transactions</p>

                    <button className="btn btn-primary" style={{ fontSize: "1.125rem", padding: "0.75rem 2rem" }}>
                        🧠 Start AI Analysis →
                    </button>

                    {/* Feature Cards */}
                    <div className="features">
                        <div className="feature-card">
                            <div className="feature-icon purple">🤖</div>
                            <h3>AI Assistant</h3>
                            <p>Get personalized insights from your email transactions using advanced AI</p>
                        </div>

                        <Link to="/expenses" className="feature-card">
                            <div className="feature-icon blue">📊</div>
                            <h3>Expense Tracker</h3>
                            <p>Track and categorize your spending with intelligent automation</p>
                        </Link>

                        <div className="feature-card">
                            <div className="feature-icon green">👥</div>
                            <h3>Friends & Social</h3>
                            <p>Split expenses and manage shared costs with your network</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: "1px solid #333", padding: "2rem 0", textAlign: "center" }}>
                <div className="container">
                    <p style={{ color: "#666" }}>© 2024 InboxSpend. Powered by AI for smarter financial decisions.</p>
                </div>
            </footer>
        </div>
    )
}

export default HomePage
