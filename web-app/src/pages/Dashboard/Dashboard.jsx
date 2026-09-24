import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import BankEmailModal from "../../components/BankEmailModal";
import "./Dashboard.css";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

const formatCurrency = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absolute = Math.abs(safeValue);
  const sign = safeValue < 0 ? "-" : "";
  return `${sign}${currencyFormatter.format(absolute)}`;
};

const Dashboard = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [bankSenderEmail, setBankSenderEmail] = useState("");
  const [bankSenderVerified, setBankSenderVerified] = useState(false);
  const [isBankEmailModalOpen, setIsBankEmailModalOpen] = useState(false);
  const [isSavingBankEmail, setIsSavingBankEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get("/api/profile/me");
        setName(res.data?.name || "");
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const res = await api.get("/api/transactions");
        setTransactions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
    fetchTransactions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest(".dashboard-profile")) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const fetchBankSenderEmail = async () => {
    try {
      const response = await api.get("/api/user/bank-email");
      setBankSenderEmail(response.data?.bankSenderEmail || "");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      return response.data?.bankSenderEmail || "";
    } catch (err) {
      console.error("Failed to load bank sender email:", err);
      return "";
    }
  };

  const clearCache = () => {
    localStorage.removeItem("transactions_cache");
    localStorage.removeItem("transactions_time");
  };

  const handleLogout = async () => {
    try {
      const res = await api.post("/api/auth/logout");
      toast.success(res.data.msg || "Logged out");
      clearCache();
      if (typeof window !== "undefined") {
        window.__BROKEBUDDY_DEV_MODE__ = false;
      }
      setIsAuthenticated(false);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data?.msg || err.message);
      toast.error("Logout failed");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!window.confirm("Do you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete("/api/profile/account");
      toast.success("Account deleted successfully.");
      localStorage.clear();
      if (typeof window !== "undefined") {
        window.__BROKEBUDDY_DEV_MODE__ = false;
      }
      if (setIsAuthenticated) {
        setIsAuthenticated(false);
      }
      navigate("/");
    } catch (err) {
      console.error("Delete Account Error:", err.response?.data?.msg || err.message);
      toast.error(err.response?.data?.msg || err.message || "Failed to delete account");
    }
  };

  const handleOpenBankEmailModal = async () => {
    await fetchBankSenderEmail();
    setIsBankEmailModalOpen(true);
  };

  const handleSaveBankEmail = async (email) => {
    setIsSavingBankEmail(true);

    try {
      const response = await api.put("/api/user/bank-email", {
        bankSenderEmail: email,
      });

      setBankSenderEmail(response.data?.bankSenderEmail || "");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      toast.success("Bank sender email updated successfully.");
      setIsBankEmailModalOpen(false);
    } catch (err) {
      console.error("Failed to save bank sender email:", err);
      toast.error(err.response?.data?.msg || err.message || "Failed to save bank sender email");
    } finally {
      setIsSavingBankEmail(false);
    }
  };

  const currentMonthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date()),
    []
  );

  const monthKey = (dateValue) => {
    const d = new Date(dateValue);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMonthTotals = (targetMonthKey) => {
    return transactions.reduce(
      (acc, tx) => {
        const date = tx?.transactionDate ? new Date(tx.transactionDate) : null;
        if (!date || monthKey(date) !== targetMonthKey) {
          return acc;
        }

        const amount = Number(tx.amount || 0);

        if (tx.debited) {
          acc.spending += amount;
        } else {
          acc.income += amount;
        }

        return acc;
      },
      { income: 0, spending: 0 }
    );
  };

  const now = new Date();
  const currentMonthKey = monthKey(now);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = monthKey(previousMonthDate);

  const currentMonthTotals = useMemo(() => getMonthTotals(currentMonthKey), [currentMonthKey, transactions]);
  const previousMonthTotals = useMemo(() => getMonthTotals(previousMonthKey), [previousMonthKey, transactions]);

  const totalIncome = useMemo(
    () => transactions.reduce((sum, tx) => (tx.debited ? sum : sum + Number(tx.amount || 0)), 0),
    [transactions]
  );

  const totalSpending = useMemo(
    () => transactions.reduce((sum, tx) => (tx.debited ? sum + Number(tx.amount || 0) : sum), 0),
    [transactions]
  );

  const totalBalance = totalIncome - totalSpending;

  const netCashFlow = currentMonthTotals.income - currentMonthTotals.spending;
  const savingsRate = currentMonthTotals.income > 0 ? (netCashFlow / currentMonthTotals.income) * 100 : 0;
  const spendingChange = previousMonthTotals.spending > 0
    ? ((currentMonthTotals.spending - previousMonthTotals.spending) / previousMonthTotals.spending) * 100
    : 0;

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 5);
  }, [transactions]);

  const monthlyTrend = useMemo(() => {
    const buckets = new Map();

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      buckets.set(key, { label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(d), income: 0, spending: 0 });
    }

    transactions.forEach((tx) => {
      const d = tx?.transactionDate ? new Date(tx.transactionDate) : null;
      if (!d) return;
      const key = monthKey(d);
      if (!buckets.has(key)) return;
      const bucket = buckets.get(key);
      const amount = Number(tx.amount || 0);
      if (tx.debited) {
        bucket.spending += amount;
      } else {
        bucket.income += amount;
      }
    });

    return Array.from(buckets.values());
  }, [now, transactions]);

  const maxTrendValue = useMemo(
    () => Math.max(...monthlyTrend.flatMap((item) => [item.income, item.spending]), 1),
    [monthlyTrend]
  );

  const trendPoints = useMemo(() => {
    const incomePoints = monthlyTrend
      .map((item, index) => `${(index / (monthlyTrend.length - 1)) * 100},${100 - (item.income / maxTrendValue) * 80}`)
      .join(" ");

    const spendingPoints = monthlyTrend
      .map((item, index) => `${(index / (monthlyTrend.length - 1)) * 100},${100 - (item.spending / maxTrendValue) * 80}`)
      .join(" ");

    return { incomePoints, spendingPoints };
  }, [monthlyTrend, maxTrendValue]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-container" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <div className="dashboard-empty-state" style={{ minHeight: "220px" }}>
            <h3>Loading your dashboard...</h3>
            <p>Fetching your profile and transaction data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="dashboard-container dashboard-nav-inner">
          <Link to="/" className="dashboard-logo">
            <span className="dashboard-logo-mark">⚡</span>
            BrokeBuddy
          </Link>

          <div className="dashboard-nav-links">
            <Link to="/" className="dashboard-nav-link">
              Overview
            </Link>
            <Link to="/expenses" className="dashboard-nav-link">
              Expenses
            </Link>
            <Link to="/chatbot" className="dashboard-nav-link">
              AI Assistant
            </Link>

            <div className="dashboard-profile">
              <button
                className="dashboard-profile-toggle"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label="Open profile menu"
              >
                {name ? name.charAt(0).toUpperCase() : "?"}
              </button>

              {isProfileOpen && (
                <div className="dashboard-profile-menu">
                  <div className="dashboard-profile-user">
                    Signed in as <br />
                    <strong>{name || "Not logged in"}</strong>
                  </div>

                  <ul className="dashboard-profile-actions">
                    <li><button onClick={handleLogout}>Logout</button></li>
                    <li><button onClick={handleOpenBankEmailModal}>Edit Bank Sender Email</button></li>
                    <li><button onClick={handleDeleteAccount} className="danger">Delete Account</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isBankEmailModalOpen && (
        <BankEmailModal
          isOpen={isBankEmailModalOpen}
          initialValue={bankSenderEmail}
          title="Edit Bank Sender Email"
          placeholder="alerts@hdfcbank.net"
          onClose={() => setIsBankEmailModalOpen(false)}
          onSave={handleSaveBankEmail}
          isSaving={isSavingBankEmail}
        />
      )}

      <main className="dashboard-main dashboard-container">
        <section className="dashboard-overview">
          <div className="dashboard-overview-intro">
            <p className="dashboard-kicker">Overview</p>
            <h1>
              {greeting}, <span className="gradient-text">{name || "Buddy"}</span>
            </h1>
            <p className="dashboard-overview-sub">Here&apos;s a quick look at your finances.</p>
          </div>

          <div className="dashboard-overview-actions">
            <div className="dashboard-month-chip">{currentMonthLabel}</div>
            <button className="dashboard-action-btn" onClick={() => navigate("/expenses")}>Sync Gmail</button>
            <button className="dashboard-action-btn primary" onClick={() => navigate("/expenses")}>+ Transaction</button>
          </div>
        </section>

        <section className="dashboard-summary-grid">
          <article className="dashboard-summary-card">
            <div className="dashboard-summary-card-header">
              <span>Net Balance</span>
              <span className="summary-dot balance" />
            </div>
            <div className="dashboard-summary-value">
              {formatCurrency(totalBalance)}
            </div>
            <div className="dashboard-summary-meta positive">
              {netCashFlow >= 0 ? "+" : "-"}{formatCurrency(Math.abs(netCashFlow))} this month
            </div>
          </article>

          <article className="dashboard-summary-card">
            <div className="dashboard-summary-card-header">
              <span>Income</span>
              <span className="summary-dot income" />
            </div>
            <div className="dashboard-summary-value">
              {formatCurrency(currentMonthTotals.income)}
            </div>
            <div className="dashboard-summary-meta">This month</div>
          </article>

          <article className="dashboard-summary-card">
            <div className="dashboard-summary-card-header">
              <span>Spending</span>
              <span className="summary-dot spending" />
            </div>
            <div className="dashboard-summary-value">
              {formatCurrency(currentMonthTotals.spending)}
            </div>
            <div className="dashboard-summary-meta">This month</div>
          </article>
        </section>

        <section className="dashboard-panels-grid">
          <article className="dashboard-panel">
            <div className="panel-header">
              <h2>Cash Flow</h2>
            </div>

            {transactions.length > 0 ? (
              <div className="cashflow-chart-wrap">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cashflow-chart" aria-label="Cash flow chart">
                  <defs>
                    <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(52,211,153,0.45)" />
                      <stop offset="100%" stopColor="rgba(52,211,153,0.02)" />
                    </linearGradient>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(248,113,113,0.5)" />
                      <stop offset="100%" stopColor="rgba(248,113,113,0.02)" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    points={trendPoints.incomePoints}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <polyline
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2.5"
                    points={trendPoints.spendingPoints}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <h3>Coming soon</h3>
                <p>Financial trends will appear here once enough transaction history is available.</p>
              </div>
            )}
          </article>

          <article className="dashboard-panel">
            <div className="panel-header">
              <h2>Quick Summary</h2>
            </div>

            {transactions.length > 0 ? (
              <ul className="quick-summary-list">
                <li className="quick-summary-item">
                  <span className="quick-summary-label">Net cash flow</span>
                  <span className="quick-summary-value">{formatCurrency(netCashFlow)}</span>
                </li>
                <li className="quick-summary-item">
                  <span className="quick-summary-label">Savings rate</span>
                  <span className="quick-summary-value">{Math.abs(savingsRate).toFixed(1)}%</span>
                </li>
                <li className="quick-summary-item">
                  <span className="quick-summary-label">Spending change</span>
                  <span className="quick-summary-value">{Math.abs(spendingChange).toFixed(1)}% vs last month</span>
                </li>
              </ul>
            ) : (
              <div className="dashboard-empty-state">
                <h3>No data yet</h3>
                <p>Once your transactions are available, quick insights will appear here.</p>
              </div>
            )}
          </article>
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-panel">
            <div className="panel-header">
              <h2>Recent Transactions</h2>
            </div>

            {recentTransactions.length > 0 ? (
              <>
                <ul className="transaction-list">
                  {recentTransactions.map((tx) => {
                    const transactionDate = tx.transactionDate ? new Date(tx.transactionDate) : null;
                    const merchantName = tx.merchant || tx.upiId || "Unknown merchant";
                    const amount = Number(tx.amount || 0);
                    const isExpense = tx.debited;

                    return (
                      <li key={tx.id} className="transaction-row">
                        <div className="transaction-main">
                          <span className="transaction-person">{merchantName}</span>
                          <span className="transaction-meta">
                            {transactionDate ? shortDateFormatter.format(transactionDate) : "Recent"} · {tx.category || "Other"}
                          </span>
                        </div>
                        <span className={`transaction-amount ${isExpense ? "expense" : "income"}`}>
                          {isExpense ? "-" : "+"}{formatCurrency(amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Link to="/expenses" className="panel-link">View all transactions →</Link>
              </>
            ) : (
              <div className="dashboard-empty-state no-data">
                <h3>No transactions yet</h3>
                <p>Sync Gmail or add your first transaction to get started.</p>
              </div>
            )}
          </article>

          <article className="dashboard-panel">
            <div className="panel-header">
              <h2>BrokeBuddy AI</h2>
            </div>

            <div className="ai-box">
              <span className="dashboard-badge">AI Available</span>
              <p className="ai-questions">
                Have a question about your finances? <br />
                Ask about spending, savings or transactions.
              </p>
              <Link to="/chatbot" className="dashboard-action-btn primary" style={{ width: "fit-content" }}>
                Open AI Assistant →
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
