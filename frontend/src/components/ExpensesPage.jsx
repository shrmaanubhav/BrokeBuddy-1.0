import { Link } from "react-router-dom"
import './ExpensePage.css';
const ExpensesPage = () => {
    const expenses = [
        {
            id: 1,
            date: "2024-01-15",
            description: "Starbucks Coffee",
            amount: 4.85,
            category: "Food & Dining",
            merchant: "Starbucks",
            type: "Card",
        },
        {
            id: 2,
            date: "2024-01-15",
            description: "Uber Ride",
            amount: 12.5,
            category: "Transportation",
            merchant: "Uber",
            type: "Card",
        },
        {
            id: 3,
            date: "2024-01-14",
            description: "Netflix Subscription",
            amount: 15.99,
            category: "Entertainment",
            merchant: "Netflix",
            type: "Subscription",
        },
        {
            id: 4,
            date: "2024-01-14",
            description: "Grocery Shopping",
            amount: 87.43,
            category: "Food & Dining",
            merchant: "Whole Foods",
            type: "Card",
        },
        {
            id: 5,
            date: "2024-01-13",
            description: "Gas Station",
            amount: 45.2,
            category: "Transportation",
            merchant: "Shell",
            type: "Card",
        },
    ]

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    return (
        <div className="expenses-wrapper">
            {/* Navigation */}
            <nav className="nav">
                <div className="container">
                    <div className="nav-content">
                        <Link to="/" className="logo">
                            ⚡ InboxSpend
                        </Link>
                        <div className="nav-links">
                            <button className="btn btn-outline">📥 Export</button>
                            <button className="btn btn-primary">➕ Add Expense</button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="expenses-page">
                <div className="container">
                    {/* Header */}
                    <div className="page-header">
                        <h1>Expense Tracking</h1>
                        <p>Monitor and categorize your spending</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Total Expenses</span>
                                <span style={{ fontSize: "20px" }}>💰</span>
                            </div>
                            <div className="stat-value">${totalExpenses.toFixed(2)}</div>
                            <div className="stat-change">
                                <span style={{ color: "#EF4444" }}>📈</span>
                                +8.2% from last month
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Transactions</span>
                                <span style={{ fontSize: "20px" }}>📋</span>
                            </div>
                            <div className="stat-value">{expenses.length}</div>
                            <div className="stat-change">
                                <span style={{ color: "#10B981" }}>📉</span>
                                -2 from last month
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Categories</span>
                                <span style={{ fontSize: "20px" }}>🏷️</span>
                            </div>
                            <div className="stat-value">5</div>
                            <div className="stat-change">Active categories</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-title">Avg. per Day</span>
                                <span style={{ fontSize: "20px" }}>📅</span>
                            </div>
                            <div className="stat-value">${(totalExpenses / 30).toFixed(2)}</div>
                            <div className="stat-change">Based on 30 days</div>
                        </div>
                    </div>

                    {/* Expenses List */}
                    <div className="expenses-list">
                        <div className="expenses-header">
                            <h2>Recent Expenses</h2>
                            <p style={{ color: "#ccc", margin: 0 }}>{expenses.length} transactions found</p>
                        </div>
                        <div className="expenses-content">
                            {expenses.map((expense) => (
                                <div key={expense.id} className="expense-item">
                                    <div className="expense-left">
                                        <div className="expense-icon">📋</div>
                                        <div className="expense-details">
                                            <h4>{expense.description}</h4>
                                            <div className="expense-meta">
                                                {expense.merchant} • {expense.date} • {expense.type}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="expense-right">
                                        <div className="expense-amount">-${expense.amount.toFixed(2)}</div>
                                        <div className="expense-category">{expense.category}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ExpensesPage
