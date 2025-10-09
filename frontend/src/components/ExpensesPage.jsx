import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ExpensePage.css";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      const requestBody = {
        email: "adithreganti@gmail.com",
        date: "7-Oct-2025",
      };

      try {
        const response = await fetch(
          "http://localhost:4000/api/expense/getExp",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (Array.isArray(data.Transactions)) {
          setExpenses(data.Transactions);
        } else {
          setExpenses([]);
        }
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch expenses:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (expense.COST || 0),
    0
  );

  const transactionCount = expenses.length;

  if (isLoading) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "4rem" }}
      >
        <h2>Loading Expenses... ⏳</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container"
        style={{ textAlign: "center", padding: "4rem", color: "#EF4444" }}
      >
        <h2>Failed to load data </h2>
        <p>
          Could not connect to the backend. Please ensure the Node.js server is
          running.
        </p>
        <p>
          <strong>Error:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div className="expenses-wrapper">
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
          <div className="page-header">
            <h1>Expense Tracking</h1>
            <p>Monitor and categorize your spending</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Expenses</span>
                <span style={{ fontSize: "20px" }}>💰</span>
              </div>
              <div className="stat-value">Rs{totalExpenses.toFixed(2)}</div>
              <div className="stat-change">
                <span style={{ color: "#EF4444" }}>📈</span> +8.2% from last
                month
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Transactions</span>
                <span style={{ fontSize: "20px" }}>📋</span>
              </div>
              <div className="stat-value">{transactionCount}</div>
              <div className="stat-change">
                <span style={{ color: "#10B981" }}>📉</span> -2 from last month
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
              <div className="stat-value">
                Rs{(totalExpenses / 30).toFixed(2)}
              </div>
              <div className="stat-change">Based on 30 days</div>
            </div>
          </div>

          <div className="expenses-list">
            <div className="expenses-header">
              <h2>Recent Expenses</h2>
              <p style={{ color: "#ccc", margin: 0 }}>
                {transactionCount} transactions found
              </p>
            </div>
            <div className="expenses-content">
              {expenses.map((expense, index) => (
                <div key={index} className="expense-item">
                  <div className="expense-left">
                    <div className="expense-icon">📋</div>
                    <div className="expense-details">
                      <h4>{expense.UPI_ID || "N/A"}</h4>
                      <div className="expense-meta">Transaction • Online</div>
                    </div>
                  </div>
                  <div className="expense-right">
                    <div className="expense-amount">
                      {typeof expense.COST === "number"
                        ? `-Rs${expense.COST.toFixed(2)}`
                        : "Rs0.00"}
                    </div>
                    <div className="expense-category">Online Payment</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
