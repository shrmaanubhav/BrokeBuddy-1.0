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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const userEmail = localStorage.getItem("userEmail");

  const formatApiDate = (date) => {
    const d = new Date(date);
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
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
  };

  const fetchRecentData = async () => {
    setIsLoading(true);
    const expenseRequestBody = { email: userEmail };
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
      setIsSearchActive(false); // We are in the "recent" view
    } catch (e) {
      setError(e.message);
      console.error("Failed to fetch data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchRecentData();
    }
  }, [userEmail]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchStartDate) {
      alert("Please select a start date.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const searchPayload = {
      email: userEmail,
      startDate: formatApiDate(searchStartDate),
      endDate: searchEndDate ? formatApiDate(searchEndDate) : null,
      query: searchQuery,
    };

    try {
      const response = await fetch("http://localhost:4000/api/expense/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
      });

      if (!response.ok) {
        throw new Error("Search request failed.");
      }

      const searchData = await response.json();
      setExpenses(searchData.Transactions || []);
      // search view
      setIsSearchActive(true);
      setIsSearchModalOpen(false);
    } catch (e) {
      setError(e.message);
      console.error("Failed to search:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchStartDate("");
    setSearchEndDate("");
    setSearchQuery("");
    fetchRecentData();
  };

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
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="btn btn-primary"
              >
                🔍 Search
              </button>
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

          {isSearchModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Search Expenses</h2>
                  <button
                    onClick={() => setIsSearchModalOpen(false)}
                    className="modal-close-btn"
                  >
                    &times;
                  </button>
                </div>
                <div className="search-bar">
                  <form onSubmit={handleSearch} className="search-form">
                    <div className="form-group">
                      <label>Start Date*</label>
                      <input
                        type="date"
                        value={searchStartDate}
                        onChange={(e) => setSearchStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={searchEndDate}
                        onChange={(e) => setSearchEndDate(e.target.value)}
                        min={searchStartDate}
                      />
                    </div>
                    <div className="form-group">
                      <label>UPI / Nickname</label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g., PAYTM or Mom"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Search
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSearchModalOpen(false)}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="expenses-list">
            <div className="expenses-header">
              <div className="expenses-header-title">
                <h2>{isSearchActive ? "Search Results" : "Recent Expenses"}</h2>
                {isSearchActive && (
                  <button
                    onClick={handleClearSearch}
                    className="btn btn-outline clear-search-btn"
                  >
                    Clear Search
                  </button>
                )}
              </div>
              <p style={{ color: "#ccc", margin: 0 }}>
                {transactionCount} transactions found
                {isSearchActive ? "" : " for the last 7 days"}
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
