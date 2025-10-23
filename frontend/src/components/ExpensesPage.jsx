import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./ExpensePage.css";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [inlineInputValue, setInlineInputValue] = useState("");

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // --- ✅ 1. Get the date from 7 days ago ---
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // e.g., if today is Oct 11, this becomes Oct 4

      // --- ✅ 2. Format it to match your backend's requirement (e.g., "4-Oct-2025") ---
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const day = sevenDaysAgo.getDate();
      const month = months[sevenDaysAgo.getMonth()];
      const year = sevenDaysAgo.getFullYear();
      const formattedStartDate = `${day}-${month}-${year}`; // Creates the string "4-Oct-2025"

      // --- ✅ 3. Use this start date in the request body ---
      const expenseRequestBody = { email: userEmail, date: formattedStartDate };
      const nicknameRequestBody = { email: userEmail };
      try {
        const [expensesResponse, nicknamesResponse] = await Promise.all([
          fetch("http://localhost:4000/api/expense/getExp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expenseRequestBody),
          }),
          fetch("http://localhost:4000/api/nicknames/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nicknameRequestBody),
          }),
        ]);

        if (!expensesResponse.ok || !nicknamesResponse.ok) {
          throw new Error("Failed to fetch data from the server.");
        }

        const expensesData = await expensesResponse.json();
        const nicknamesData = await nicknamesResponse.json();

        setExpenses(expensesData.Transactions || []);
        setNicknames(nicknamesData || {});
      } catch (e) {
        setError(e.message);
        console.error("Failed to fetch data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartEditing = (index, currentNickname) => {
    setEditingIndex(index);
    setInlineInputValue(currentNickname || "");
  };

  const handleSaveNickname = async (upiId, index) => {
    const trimmedNickname = inlineInputValue.trim();
    const updatedNicknames = { ...nicknames };

    if (trimmedNickname) {
      updatedNicknames[upiId] = trimmedNickname;
    } else {
      delete updatedNicknames[upiId];
    }

    setNicknames(updatedNicknames);
    setEditingIndex(null);

    try {
      await fetch("http://localhost:4000/api/nicknames/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          upiId: upiId,
          nickname: trimmedNickname,
        }),
      });
    } catch (error) {
      console.error("Failed to save nickname:", error);
    }
  };

  const totalExpenses = expenses
    .filter((expense) => expense.DEBITED)
    .reduce((sum, expense) => sum + (expense.COST || 0), 0);
  const transactionCount = expenses.length;

  const totalCredited = expenses
    .filter((expense) => !expense.DEBITED)
    .reduce((sum, expense) => sum + (expense.COST || 0), 0);

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
        <h2>Failed to load data</h2>
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
              ⚡ BrokeBuddy
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
                <span style={{ color: "#EF4444" }}>📈</span> Debited this week
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Total Credited</span>
                <span style={{ fontSize: "20px" }}>🤑</span>
              </div>
              <div className="stat-value">Rs{totalCredited.toFixed(2)}</div>
              <div className="stat-change">
                <span style={{ color: "#10B981" }}>📈</span> Credited this week
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Transactions</span>
                <span style={{ fontSize: "20px" }}>📋</span>
              </div>
              <div className="stat-value">{transactionCount}</div>
              <div className="stat-change">
                <span style={{ color: "#10B981" }}>📉</span> -2 from last week
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
          </div>

          <div className="expenses-list">
            <div className="expenses-header">
              <h2>Recent Expenses</h2>
              <p style={{ color: "#ccc", margin: 0 }}>
                {transactionCount} transactions found for the last week
              </p>
            </div>
            <div className="expenses-content">
              {(() => {
                const reversedExpenses = [...expenses].reverse();

                const transactionsToShow = showAll
                  ? reversedExpenses
                  : reversedExpenses.slice(0, 10);

                return (
                  <>
                    {transactionsToShow.map((expense, index) => {
                      const nickname = nicknames[expense.UPI_ID];
                      const isEditing = editingIndex === index;

                      return (
                        <div key={index} className="expense-item">
                          <div className="expense-left">
                            <div className="expense-icon">📋</div>
                            <div className="expense-details">
                              {isEditing ? (
                                <div>
                                  <div className="nickname-edit-view">
                                    <input
                                      type="text"
                                      className="nickname-input"
                                      value={inlineInputValue}
                                      onChange={(e) =>
                                        setInlineInputValue(e.target.value)
                                      }
                                      placeholder="Enter a nickname..."
                                      autoFocus
                                    />
                                    <button
                                      onClick={() =>
                                        handleSaveNickname(
                                          expense.UPI_ID,
                                          index
                                        )
                                      }
                                      className="edit-nickname-btn"
                                      title="Save nickname"
                                    >
                                      💾
                                    </button>
                                  </div>
                                  <p
                                    className="expense-meta"
                                    style={{ wordBreak: "break-all" }}
                                  >
                                    {expense.UPI_ID}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  {nickname ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <h4 style={{ margin: 0 }}>{nickname}</h4>
                                      <button
                                        onClick={() =>
                                          handleStartEditing(index, nickname)
                                        }
                                        className="edit-nickname-btn"
                                        title="Edit nickname"
                                      >
                                        ✏️
                                      </button>
                                    </div>
                                  ) : (
                                    <div
                                      className="nickname-placeholder"
                                      onClick={() =>
                                        handleStartEditing(index, "")
                                      }
                                    >
                                      Add a nickname...
                                    </div>
                                  )}
                                  <p
                                    className="expense-meta"
                                    style={{ wordBreak: "break-all" }}
                                  >
                                    {expense.UPI_ID}
                                  </p>
                                </div>
                              )}
                              <div className="expense-meta">
                                Transaction • Online
                              </div>
                            </div>
                          </div>
                          <div className="expense-right">
                            <div
                              className={`expense-amount ${
                                expense.DEBITED ? "debited" : "credited"
                              }`}
                            >
                              {typeof expense.COST === "number"
                                ? `${
                                    expense.DEBITED ? "-" : "+"
                                  }Rs${expense.COST.toFixed(2)}`
                                : "Rs0.00"}
                            </div>
                            <div className="expense-category">
                              Online Payment
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {expenses.length > 10 && (
                      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                        <button
                          onClick={() => setShowAll(!showAll)}
                          className="btn btn-outline"
                        >
                          {showAll ? "Show Less" : "Show More"}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
