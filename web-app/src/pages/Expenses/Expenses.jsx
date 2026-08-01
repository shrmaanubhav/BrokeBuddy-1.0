import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Expenses.css";
import toast from "react-hot-toast";
import api from "../../lib/api";
import BankEmailModal from "../../components/BankEmailModal";

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

const invalidateCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);
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
  const [bankSenderEmail, setBankSenderEmail] = useState("");
  const [bankSenderVerified, setBankSenderVerified] = useState(false);
  const [isBankEmailModalOpen, setIsBankEmailModalOpen] = useState(false);
  const [pendingSyncAfterSave, setPendingSyncAfterSave] = useState(false);
  const [isSavingBankEmail, setIsSavingBankEmail] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isNoTransactionsModalOpen, setIsNoTransactionsModalOpen] = useState(false);

  const fetchBankSenderEmail = async () => {
    try {
      const response = await api.get("/user/bank-email");
      const sender = response.data?.bankSenderEmail || "";
      setBankSenderEmail(sender);
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      return sender;
    } catch (err) {
      console.error("Failed to fetch bank sender email:", err);
      return null;
    }
  };

  const verifyBankSenderEmail = async () => {
    try {
      const response = await api.post("/user/bank-email/verify");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      return response.data?.bankSenderVerified === true;
    } catch (err) {
      console.error("Failed to verify bank sender email:", err);
      toast.error(
        err.response?.data?.msg || err.message ||
          "Failed to confirm sender email."
      );
      return false;
    }
  };

  const notifyTransactionsRefreshed = () => {
    window.dispatchEvent(new Event("transactionsRefreshed"));
  };

  const performSync = async () => {
    setIsSyncing(true);
    const toastId = toast.loading("Syncing transactions...");

    try {
      const response = await api.post("/profile/sync-transactions");

      if (response.data?.total === 0) {
        if (bankSenderVerified) {
          toast.success("No new transactions found.");
        } else {
          setIsNoTransactionsModalOpen(true);
        }
      } else {
        toast.success(response.data?.msg || "Transactions synced successfully!");
        notifyTransactionsRefreshed();
      }
    } catch (err) {
      console.error("Failed to sync transactions:", err);
      toast.error(
        err.response?.data?.msg || err.message || "Failed to sync transactions"
      );
    } finally {
      setIsSyncing(false);
      toast.dismiss(toastId);
    }
  };

  const handleSyncTransactions = async () => {
    const toastId = toast.loading("Checking bank sender email...");

    try {
      const sender = await fetchBankSenderEmail();

      if (!sender) {
        setPendingSyncAfterSave(true);
        setIsBankEmailModalOpen(true);
        return;
      }

      await performSync();
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleSaveBankEmail = async (email, syncAfterSave = false) => {
    setIsSavingBankEmail(true);

    try {
      const response = await api.put("/user/bank-email", {
        bankSenderEmail: email,
      });

      setBankSenderEmail(response.data?.bankSenderEmail || "");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      setIsBankEmailModalOpen(false);
      toast.success("Bank sender email saved successfully.");

      if (syncAfterSave || pendingSyncAfterSave) {
        setPendingSyncAfterSave(false);
        await performSync();
      }
    } catch (err) {
      console.error("Failed to save bank sender email:", err);
      toast.error(
        err.response?.data?.msg || err.message || "Failed to save bank sender email"
      );
    } finally {
      setIsSavingBankEmail(false);
    }
  };

  const handleOpenBankEmailModal = async () => {
    await fetchBankSenderEmail();
    setPendingSyncAfterSave(false);
    setIsBankEmailModalOpen(true);
  };

  const handleEditSenderEmailFromDialog = async () => {
    await fetchBankSenderEmail();
    setIsNoTransactionsModalOpen(false);
    setPendingSyncAfterSave(true);
    setIsBankEmailModalOpen(true);
  };

  const handleConfirmNoTransactions = async () => {
    setIsNoTransactionsModalOpen(false);
    const verified = await verifyBankSenderEmail();

    if (verified) {
      toast.success(
        "No transactions found. Your sender email has been confirmed."
      );
    }
  };

  const handleRetrySync = async () => {
    setIsNoTransactionsModalOpen(false);
    const sender = await fetchBankSenderEmail();

    if (!sender) {
      setPendingSyncAfterSave(true);
      setIsBankEmailModalOpen(true);
      return;
    }

    await performSync();
  };


    const fetchNicknames = async () => {
      try {
        const response = await api.get("/nicknames");

        setNicknames(response.data || {});
      } catch (err) {
        console.error("Failed to fetch nicknames:", err);

        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch nicknames"
        );
      }
    };

  useEffect(() => { 
    fetchNicknames();

    const cached = loadCache();

    if (cached) {
      console.log("✅ Using cached transactions");
      setExpenses(cached);
      setCachedTransactions(cached);
      setIsLoading(false);
    } else {
      console.log("⚠ No cache found, fetching from backend...");
      fetchRecentData();
    }
  }, []);

  useEffect(() => {
    const handleTransactionsRefreshed = () => {
      invalidateCache();
      fetchRecentData();
    };

    window.addEventListener("transactionsRefreshed", handleTransactionsRefreshed);
    return () => {
      window.removeEventListener("transactionsRefreshed", handleTransactionsRefreshed);
    };
  }, []);

  const fetchRecentData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get("/transactions");

      console.log(response.data);

      const transactions = response.data || [];

      setExpenses(transactions);
      setCachedTransactions(transactions);
      saveCache(transactions);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch transactions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    invalidateCache();
    await fetchRecentData();
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

      const startISO = new Date(searchStartDate).toISOString().split("T")[0];
      const endISO = searchEndDate
        ? new Date(searchEndDate).toISOString().split("T")[0]
        : today.toISOString().split("T")[0];

      const filtered = cachedTransactions.filter((t) => {
        const txnISO = new Date(t.transactionDate).toISOString().split("T")[0];
        const matchDate = txnISO >= startISO && txnISO <= endISO;
        const matchQuery = (() => {
          if (!searchQuery) return true;

          const query = searchQuery.toLowerCase();
          const upi = (t.upiId || "").toLowerCase();
          const merchant = (t.merchant || "").toLowerCase();
          const notes = (t.notes || "").toLowerCase();
          const amt = (t.amount?.toString() || "").toLowerCase();

          return (
            upi.includes(query) ||
            merchant.includes(query) ||
            notes.includes(query) ||
            amt.includes(query)
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

    try {
      const response = await api.get("/transactions/search", {
        params: {
          startDate: searchStartDate,
          endDate: searchEndDate || undefined,
          query: searchQuery || undefined,
        },
      });

      setExpenses(response.data || []);
      setIsSearchActive(true);
      setIsSearchModalOpen(false);
    } catch (err) {
      console.error("Failed to search:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Search request failed"
      );
    } finally {
      console.log("=== SEARCH DEBUG END (BACKEND CALL) ===");
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchStartDate("");
    setSearchEndDate("");
    setSearchQuery("");
    setIsSearchActive(false);
    invalidateCache();
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
      await api.post("/nicknames", {
        upiId,
        nickname: trimmedNickname,
      });
    } catch (err) {
      console.error("Failed to save nickname:", err);

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to save nickname"
      );
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

    const input = newExpenseData.nicknameOrUpiId.trim();

    // Check whether the entered text is an existing nickname
    const nicknameMatch = Object.entries(nicknames).find(
      ([, nickname]) => nickname.toLowerCase() === input.toLowerCase()
    );

    setIsLoading(true);
    setError(null);

    const payload = {
      // Always preserve the entered name as the merchant
      merchant: input,

      // If the name already exists as a nickname, associate its UPI ID.
      // Otherwise this is a brand-new manual transaction.
      upiId: nicknameMatch ? nicknameMatch[0] : null,

      amount: Number(newExpenseData.amount),
      debited: newExpenseData.debited,
      transactionDate: newExpenseData.date,
    };

    try {
      await api.post("/transactions", payload);

      toast.success("Transaction added successfully");

      setIsAddModalOpen(false);

      setNewExpenseData({
        nicknameOrUpiId: "",
        amount: "",
        debited: true,
        date: "",
      });

      refreshTransactions();
    } catch (err) {
      console.error("Failed to add transaction:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add transaction."
      );
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
      await api.delete(`/transactions/${id}`);

      toast.success("Transaction deleted successfully");
      refreshTransactions();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete transaction."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const totalExpenses = expenses
    .filter((expense) => expense.debited)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const transactionCount = expenses.length;

  const totalCredited = expenses
    .filter((expense) => !expense.debited)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

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
            <div>
              <h1>Expense Tracking</h1>
              <p>
                Import your online transactions directly from your Gmail. On the first
                sync, you'll be asked for your bank's transaction sender email so only
                relevant emails are scanned.
              </p>
            </div>
            <div className="page-header-actions">
              <button
                onClick={handleSyncTransactions}
                className="btn btn-primary"
                disabled={isSyncing}
              >
                {isSyncing ? "Syncing..." : "🔄 Sync Transactions"}
              </button>
            </div>
          </div>

          <BankEmailModal
            isOpen={isBankEmailModalOpen}
            initialValue={bankSenderEmail}
            title={pendingSyncAfterSave ? "Bank Sender Email" : "Edit Bank Sender Email"}
            placeholder="alerts@hdfcbank.net"
            onClose={() => {
              setIsBankEmailModalOpen(false);
              setPendingSyncAfterSave(false);
            }}
            onSave={(email) => handleSaveBankEmail(email, true)}
            isSaving={isSavingBankEmail}
          />

          {isNoTransactionsModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>No Transactions Found</h2>
                  <button
                    onClick={() => setIsNoTransactionsModalOpen(false)}
                    className="modal-close-btn"
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-form">
                  <p>
                    We couldn't find any transaction emails from the configured sender email.
                    Are you sure this is the correct sender email used by your bank?
                  </p>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleConfirmNoTransactions}
                    >
                      Yes, it's correct
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleEditSenderEmailFromDialog}
                    >
                      Change Sender Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      const merchant = expense.merchant;
                      const upi = expense.upiId;
                      const nickname = upi ? nicknames[upi] : null;
                      const isEditing = editingIndex === index;

                      // Determine display lines and whether editing is allowed
                      let titleLine = "";
                      let subtitleLine = null;
                      const editingAllowed = Boolean(upi);

                      if (merchant && upi) {
                        // Case A: merchant exists AND upiId exists
                        titleLine = merchant;
                        subtitleLine = upi;
                      } else if (merchant && !upi) {
                        // Case B: merchant exists AND upiId is null
                        titleLine = merchant;
                        subtitleLine = null;
                      } else if (!merchant && nickname && upi) {
                        // Case C: merchant is null AND nickname exists
                        titleLine = nickname;
                        subtitleLine = upi;
                      } else if (!merchant && !nickname && upi) {
                        // Case D: neither merchant nor nickname exists (but upi exists)
                        titleLine = "Add a nickname...";
                        subtitleLine = upi;
                      } else {
                        // Fallback: neither merchant nor upi present
                        titleLine = "Add a nickname...";
                        subtitleLine = null;
                      }

                      const formattedDate = new Date(
                        expense.transactionDate
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });

                      return (
                        <div key={expense.id} className="expense-item">
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
                                          expense.upiId,
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
                                    {subtitleLine || "Unknown"}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  {/**
                                   * Render titleLine as either a clickable placeholder
                                   * or a static title. Only allow editing when a UPI ID
                                   * exists (editingAllowed).
                                   */}
                                  {titleLine === "Add a nickname..." ? (
                                    editingAllowed ? (
                                      <div
                                        className="nickname-placeholder"
                                        onClick={() => handleStartEditing(index, "")}
                                      >
                                        {titleLine}
                                      </div>
                                    ) : (
                                      <div className="nickname-placeholder" style={{ opacity: 0.6 }}>
                                        {titleLine}
                                      </div>
                                    )
                                  ) : (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                      }}
                                    >
                                      <h4 style={{ margin: 0 }}>{titleLine}</h4>
                                      {editingAllowed && (
                                        <button
                                          onClick={() =>
                                            handleStartEditing(index, titleLine)
                                          }
                                          className="edit-nickname-btn"
                                          title="Edit nickname"
                                        >
                                          ✏️
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {subtitleLine && (
                                    <p
                                      className="expense-meta"
                                      style={{ wordBreak: "break-all" }}
                                    >
                                      {subtitleLine}
                                    </p>
                                  )}
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
                                expense.debited ? "debited" : "credited"
                              }`}
                            >
                              {typeof expense.amount === "number"
                                ? `${
                                    expense.debited ? "-" : "+"
                                  }Rs${expense.amount.toFixed(2)}`
                                : "Rs0.00"}
                            </div>
                            <div className="expense-right-bottom">
                              <div className="expense-category">
                                {expense.source === "MANUAL" ? "Manual" : "Online"}
                              </div>
                              {expense.source === "MANUAL" && (
                                <button
                                  onClick={() => handleDelete(expense.id)}
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
