import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ExpensePage.css";
import toast, { Toaster } from "react-hot-toast";

const CACHE_KEY = "transactions_cache";
const CACHE_TIME_KEY = "transactions_time";
const CACHE_DURATION = 30 * 60 * 1000;

const loadCache = () => {
  const data = localStorage.getItem(CACHE_KEY);
  const time = localStorage.getItem(CACHE_TIME_KEY);

  if (!data || !time) return null;
  if (Date.now() - Number(time) > CACHE_DURATION) return null;

  return JSON.parse(data);
};

const saveCache = (transactions) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(transactions));
  localStorage.setItem(CACHE_TIME_KEY, Date.now());
};

const ExpensesPage = () => {
  const [cachedTransactions, setCachedTransactions] = useState([]);

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExpenseData, setNewExpenseData] = useState({
    nicknameOrUpiId: "",
    amount: "",
    debited: true,
    date: "",
  });

  const userEmail = localStorage.getItem("userEmail");

  const fetchNicknames = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/nicknames/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) throw new Error("Failed to fetch nicknames");

      const data = await response.json();
      setNicknames(data || {});
    } catch (err) {
      console.error("Failed to fetch nicknames:", err);
    }
  };

  useEffect(() => {
    if (!userEmail) return;
    fetchNicknames();
    const cached = null;
    if (cached) {
      console.log("✅ Using cached transactions from localStorage");
      setExpenses(cached);
      setCachedTransactions(cached);
      setIsLoading(false);
    } else {
      console.log("⚠ No cache found, fetching from backend...");
      fetchRecentData();
    }
  }, [userEmail]);

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
    try {
      const response = await fetch("http://localhost:4000/api/expense/getExp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!response.ok) throw new Error("Failed to fetch expenses");
      console.log(response);
      const data = await response.json();
      setExpenses(data.Transactions || []);
      setCachedTransactions(data.Transactions || []);
      saveCache(data.Transactions || []); // <-- persist to localStorage
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchStartDate) {
      toast.error("Please select a start date.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const today = new Date();
    const start = new Date(searchStartDate);
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && cachedTransactions.length > 0) {
      console.log("✅ Search is within 7 days — checking cache...");

      const convertDisplayToISO = (dateStr) => {
        const [day, monthName, year] = dateStr.split("-");
        const dateObj = new Date(`${day}-${monthName}-${year}`);
        return dateObj.toISOString().split("T")[0];
      };

      const startISO = new Date(searchStartDate).toISOString().split("T")[0];
      const endISO = searchEndDate
        ? new Date(searchEndDate).toISOString().split("T")[0]
        : today.toISOString().split("T")[0];

      const filtered = cachedTransactions.filter((t) => {
        const txnISO = convertDisplayToISO(t.date);
        const matchDate = txnISO >= startISO && txnISO <= endISO;
        const matchQuery = (() => {
          if (!searchQuery) return true;

          const query = searchQuery.toLowerCase();

          const upi = (t.UPI_ID || t.nicknameOrUpiId || "").toLowerCase();
          const desc = (t.description || "").toLowerCase();
          const amt = (t.COST?.toString() || "").toLowerCase();

          return (
            upi.includes(query) || desc.includes(query) || amt.includes(query)
          );
        })();

        return matchDate && matchQuery;
      });

      if (filtered.length > 0) {
        console.log("✅ Using cached results");
        setExpenses(filtered);
        setIsSearchActive(true);
        setIsSearchModalOpen(false);
        setIsLoading(false);
        return;
      }

      console.log("No Cache — calling backend");
    } else {
      console.log("cache empty — calling backend");
    }

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

      if (!response.ok) throw new Error("Search request failed.");

      const searchData = await response.json();
      setExpenses(searchData.Transactions || []);
      setIsSearchActive(true);
      setIsSearchModalOpen(false);
    } catch (e) {
      setError(e.message);
      console.error("Failed to search:", e);
    } finally {
      console.log("=== SEARCH DEBUG END (BACKEND CALL) ===");
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchStartDate("");
    setSearchEndDate("");
    setSearchQuery("");
    const cached = loadCache();
    if (cached) {
      setExpenses(cached);
      setIsSearchActive(false);
    } else {
      fetchRecentData();
    }
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

  const handleAddFormChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "debited") {
      setNewExpenseData((prevData) => ({
        ...prevData,
        debited: value === "true",
      }));
    } else {
      setNewExpenseData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (
      !newExpenseData.nicknameOrUpiId ||
      !newExpenseData.amount ||
      !newExpenseData.date
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      email: userEmail,
      nicknameOrUpiId: newExpenseData.nicknameOrUpiId,
      amount: newExpenseData.amount,
      debited: newExpenseData.debited,
      date: newExpenseData.date,
    };

    try {
      const response = await fetch("http://localhost:4000/api/expense/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add transaction.");
      }

      setIsAddModalOpen(false);
      setNewExpenseData({
        nicknameOrUpiId: "",
        amount: "",
        debited: true,
        date: "",
      });

      fetchRecentData();
    } catch (err) {
      setError(err.message || "Failed to add transaction.");
      console.error("Failed to add transaction:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this manual transaction?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:4000/api/expense/delete/${id}?email=${encodeURIComponent(
          userEmail
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || "Failed to delete transaction.");
      }

      toast.success("Transaction deleted successfully");

      fetchRecentData();
    } catch (err) {
      setError(err.message || "Failed to delete transaction.");
      console.error("Failed to delete transaction:", err);
    } finally {
      setIsLoading(false);
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
              {/* <button className="btn btn-outline">📥 Export</button> */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
              >
                ➕ Add Expense
              </button>
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
                      <br />
                      <input
                        type="date"
                        value={searchStartDate}
                        onChange={(e) => setSearchStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <br />
                      <input
                        type="date"
                        value={searchEndDate}
                        onChange={(e) => setSearchEndDate(e.target.value)}
                        min={searchStartDate}
                      />
                    </div>
                    <div className="form-group">
                      <label>UPI / Nickname</label>
                      <br />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g., PAYTM or Mom"
                      />
                    </div>
                    <br />
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Search
                      </button>{" "}
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

          {isAddModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Add Manual Transaction</h2>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="modal-close-btn"
                  >
                    &times;
                  </button>
                </div>
                <div className="add-expense-form-container">
                  <form onSubmit={handleAddSubmit} className="add-expense-form">
                    <div className="form-group">
                      <label>Nickname / UPI ID*</label>
                      <br />
                      <input
                        type="text"
                        name="nicknameOrUpiId"
                        value={newExpenseData.nicknameOrUpiId}
                        onChange={handleAddFormChange}
                        placeholder="Enter Nickname or UPI ID"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Amount*</label>
                      <br />
                      <input
                        type="number"
                        name="amount"
                        value={newExpenseData.amount}
                        onChange={handleAddFormChange}
                        placeholder="e.g., 50.00"
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Date*</label>
                      <br />
                      <input
                        type="date"
                        name="date"
                        value={newExpenseData.date}
                        onChange={handleAddFormChange}
                        required
                      />
                    </div>
                    <br />
                    <div className="form-group radio-group">
                      <label>Type:</label>
                      <div>
                        <input
                          type="radio"
                          id="debitRadio"
                          name="debited"
                          value="true"
                          checked={newExpenseData.debited === true}
                          onChange={handleAddFormChange}
                        />
                        <label htmlFor="debitRadio">Debit (-)</label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id="creditRadio"
                          name="debited"
                          value="false"
                          checked={newExpenseData.debited === false}
                          onChange={handleAddFormChange}
                        />
                        <label htmlFor="creditRadio">Credit (+)</label>
                      </div>
                    </div>
                    <br />
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Save Transaction
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
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
                // const reversedExpenses = [...expenses].reverse();

                const transactionsToShow = showAll
                  ? expenses
                  : expenses.slice(0, 10);

                return (
                  <>
                    {transactionsToShow.map((expense, index) => {
                      const nickname = nicknames[expense.UPI_ID];
                      const isEditing = editingIndex === index;

                      const formattedDate = new Date(
                        expense.date
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

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
                                {formattedDate}
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
                            <div className="expense-right-bottom">
                              <div className="expense-category">
                                {expense.isManual ? "Manual" : "Online"}
                              </div>
                              {expense.isManual && (
                                <button
                                  onClick={() => handleDelete(expense._id)}
                                  className="delete-btn"
                                  title="Delete manual transaction"
                                >
                                  🗑️
                                </button>
                              )}
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
