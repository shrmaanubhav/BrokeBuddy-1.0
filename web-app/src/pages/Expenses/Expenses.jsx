import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Expenses.css";
import toast from "react-hot-toast";
import api from "../../lib/api";
import BankEmailModal from "../../components/BankEmailModal";

const CACHE_KEY = "transactions_cache";
const CACHE_TIME_KEY = "transactions_time";
const CACHE_DURATION = 30 * 60 * 1000;
const TRANSACTIONS_PER_PAGE = 10;

const generateMonthOptions = (monthsBack = 24) => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    opts.push({ value: `${year}-${month}`, label });
  }
  return opts;
};

// Helpers for safe date parsing/formatting without timezone shifts
const parseISODateLocal = (isoYmd) => {
  if (!isoYmd) return null;
  const parts = isoYmd.split("-");
  if (parts.length !== 3) return new Date(isoYmd);
  const y = Number(parts[0]);
  const m = Number(parts[1]) - 1;
  const d = Number(parts[2]);
  return new Date(y, m, d);
};

const formatYMD = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Simple Calendar component (no external libs)
const Calendar = ({ start, end, hover, onDayClick, onDayHover }) => {
  const [visible, setVisible] = useState(new Date());

  const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

  const prevMonth = () => setVisible((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  const nextMonth = () => setVisible((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));

  const month = visible.getMonth();
  const year = visible.getFullYear();

  // build days starting Monday
  const firstWeekday = (d) => (d.getDay() + 6) % 7; // 0=Mon
  const first = startOfMonth(visible);
  const last = endOfMonth(visible);
  const padStart = firstWeekday(first);
  const days = [];
  for (let i = 0; i < padStart; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));

  const inRange = (d, s, e) => {
    if (!d) return false;
    const t = d.setHours(0,0,0,0);
    if (s && e) return t >= s.setHours(0,0,0,0) && t <= e.setHours(0,0,0,0);
    return false;
  };

  const previewRange = (d) => {
    if (!start || end) return false;
    if (!d) return false;
    const s = new Date(start);
    const h = hover ? new Date(hover) : d;
    const a = s < h ? s : h;
    const b = s < h ? h : s;
    return d >= a && d <= b;
  };

  return (
    <div className="calendar-root">
      <div className="calendar-header">
        <button type="button" className="calendar-nav" onClick={prevMonth} aria-label="Previous month">‹</button>
        <div className="calendar-title">{visible.toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
        <button type="button" className="calendar-nav" onClick={nextMonth} aria-label="Next month">›</button>
      </div>
      <div className="calendar-grid">
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
        {days.map((dt, idx) => {
          const isStart = dt && start && dt.toDateString() === new Date(start).toDateString();
          const isEnd = dt && end && dt.toDateString() === new Date(end).toDateString();
          const isIn = dt && start && end && (new Date(dt) >= new Date(start) && new Date(dt) <= new Date(end));
          const isPreview = dt && start && !end && hover && previewRange(dt);
          const cls = [
            'calendar-cell',
            isStart ? 'is-start' : '',
            isEnd ? 'is-end' : '',
            isIn ? 'in-range' : '',
            isPreview ? 'in-preview' : '',
          ].join(' ');

          return (
            <div
              key={idx}
              className={cls}
              onMouseEnter={() => onDayHover && dt && onDayHover(new Date(dt))}
              onMouseLeave={() => onDayHover && onDayHover(null)}
              onClick={() => dt && onDayClick && onDayClick(new Date(dt))}
            >
              {dt ? dt.getDate() : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "expenses", label: "Expenses" },
  { value: "income", label: "Income" },
  { value: "upi", label: "UPI" },
  { value: "manual", label: "Manual" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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
  const [selectedFilter, setSelectedFilter] = useState("all");
  const monthOptions = generateMonthOptions(24);
  const recentMonths = monthOptions.slice(0, 5);
  const defaultMonthValue = recentMonths.length ? recentMonths[0].value : "custom";
  const [selectedRange, setSelectedRange] = useState(defaultMonthValue);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showMenuId, setShowMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [pickerStart, setPickerStart] = useState(null);
  const [pickerEnd, setPickerEnd] = useState(null);
  const [pickerHover, setPickerHover] = useState(null);
  const pickerRef = useRef(null);

  // Reset page when filters/search/month change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRange, selectedFilter, searchQuery, searchStartDate, searchEndDate, customStartDate, customEndDate]);

  // Ensure currentPage is within bounds when totalPages changes
  useEffect(() => {
    if (currentPage > 1) {
      const totalPages = Math.max(1, Math.ceil(expenses.filter((item) => matchesDateRange(item) && matchesFilter(item) && matchesQuery(item)).length / TRANSACTIONS_PER_PAGE));
      if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses.length]);

  // Close transaction menus when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest || !e.target.closest(".transaction-actions")) {
        setShowMenuId(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const fetchBankSenderEmail = async () => {
    try {
      const response = await api.get("/api/user/bank-email");
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
      const response = await api.post("/api/user/bank-email/verify");
      setBankSenderVerified(response.data?.bankSenderVerified === true);
      return response.data?.bankSenderVerified === true;
    } catch (err) {
      console.error("Failed to verify bank sender email:", err);
      toast.error(
        err.response?.data?.msg || err.message || "Failed to confirm sender email."
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
      const response = await api.post("/api/profile/sync-transactions");

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
      const response = await api.put("/api/user/bank-email", {
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

  const fetchNicknames = async () => {
    try {
      const response = await api.get("/api/nicknames");
      setNicknames(response.data || {});
    } catch (err) {
      console.error("Failed to fetch nicknames:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to fetch nicknames"
      );
    }
  };

  useEffect(() => {
    fetchNicknames();

    const cached = loadCache();
    if (cached) {
      setExpenses(cached);
      setCachedTransactions(cached);
      setIsLoading(false);
    } else {
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
      const response = await api.get("/api/transactions");
      const transactions = response.data || [];
      setExpenses(transactions);
      setCachedTransactions(transactions);
      saveCache(transactions);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch transactions"
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
        setExpenses(filtered);
        setIsSearchActive(true);
        setIsSearchModalOpen(false);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await api.get("/api/transactions/search", {
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
        err.response?.data?.message || err.message || "Search request failed"
      );
    } finally {
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

  const handleSaveNickname = async (upiId) => {
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
      await api.post("/api/nicknames", {
        upiId,
        nickname: trimmedNickname,
      });
    } catch (err) {
      console.error("Failed to save nickname:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to save nickname"
      );
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
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
    const nicknameMatch = Object.entries(nicknames).find(
      ([, nickname]) => nickname.toLowerCase() === input.toLowerCase()
    );

    setIsLoading(true);
    setError(null);

    const payload = {
      merchant: input,
      upiId: nicknameMatch ? nicknameMatch[0] : null,
      amount: Number(newExpenseData.amount),
      debited: newExpenseData.debited,
      transactionDate: newExpenseData.date,
    };

    try {
      await api.post("/api/transactions", payload);
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
        err.response?.data?.message || err.message || "Failed to add transaction."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manual transaction?")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/api/transactions/${id}`);
      toast.success("Transaction deleted successfully");
      refreshTransactions();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to delete transaction."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRangeBounds = (range) => {
    const now = new Date();
    // If the range is a month value like 'YYYY-MM', parse that month
    if (range && /^\d{4}-\d{2}$/.test(range)) {
      const [y, m] = range.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { start, end };
    }

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (range) {
      case "thisYear":
        return { start: yearStart, end: new Date(now.getFullYear(), 11, 31) };
      case "custom":
        if (!customStartDate && !customEndDate) {
          return { start: startOfMonth, end: endOfMonth };
        }
        return {
          start: customStartDate ? parseISODateLocal(customStartDate) : new Date(0),
          end: customEndDate ? parseISODateLocal(customEndDate) : new Date(),
        };
      default:
        // default to current month
        return { start: startOfMonth, end: endOfMonth };
    }
  };

  const matchesDateRange = (transaction) => {
    if (!transaction?.transactionDate) return true;
    const currentRange = getDateRangeBounds(selectedRange);
    const txDate = new Date(transaction.transactionDate);
    if (Number.isNaN(txDate.getTime())) return true;
    return txDate >= currentRange.start && txDate <= currentRange.end;
  };

  const matchesFilter = (transaction) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "expenses") return !!transaction.debited;
    if (selectedFilter === "income") return !transaction.debited;
    if (selectedFilter === "upi") {
      const source = (transaction.source || "").toUpperCase();
      return source.includes("UPI") || !!transaction.upiId;
    }
    if (selectedFilter === "manual") {
      return (transaction.source || "").toUpperCase().includes("MANUAL");
    }
    return true;
  };

  const matchesQuery = (transaction) => {
    const qry = searchQuery.trim().toLowerCase();
    if (!qry) return true;

    return [
      transaction.merchant,
      transaction.upiId,
      transaction.notes,
      transaction.category,
      transaction.source,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(qry));
  };

  const filteredTransactions = [...expenses]
    .filter((item) => matchesDateRange(item) && matchesFilter(item) && matchesQuery(item))
    .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

  // Pagination: slice after filtering
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (safeCurrentPage - 1) * TRANSACTIONS_PER_PAGE,
    safeCurrentPage * TRANSACTIONS_PER_PAGE
  );

  const groupedTransactions = paginatedTransactions.reduce((groups, tx) => {
    const date = parseISODateLocal(tx.transactionDate);
    const key = formatYMD(date);
    if (!groups[key]) {
      groups[key] = []; 
    }
    groups[key].push(tx);
    return groups;
  }, {});

  const formatDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.toLocaleString("en-US", { month: "long" }).toUpperCase()} ${date.getDate()}`;
  };

  const totalSpent = filteredTransactions
    .filter((item) => item.debited)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalReceived = filteredTransactions
    .filter((item) => !item.debited)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const dateRangeLabel =
    selectedRange === "custom"
      ? customStartDate && customEndDate
        ? `${parseISODateLocal(customStartDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${parseISODateLocal(customEndDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
        : "Custom range"
      : monthOptions.find((option) => option.value === selectedRange)?.label || "This month";

  // Helper: apply picker selection to actual custom dates
  const applyPickerRange = () => {
    if (pickerStart) setCustomStartDate(formatYMD(pickerStart));
    if (pickerEnd) setCustomEndDate(formatYMD(pickerEnd));
    setPickerHover(null);
    setCustomPickerOpen(false);
    setSelectedRange("custom");
  };

  const cancelPicker = () => {
    // close without changing current customStartDate/customEndDate
    setPickerStart(customStartDate ? new Date(customStartDate) : null);
    setPickerEnd(customEndDate ? new Date(customEndDate) : null);
    setCustomPickerOpen(false);
    setSelectedRange((prev) => (prev === "custom" && !customStartDate && !customEndDate ? recentMonths[0].value : prev));
  };

  // handle outside click and ESC to close popover
  useEffect(() => {
    if (!customPickerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") cancelPicker();
    };
    const onDoc = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        cancelPicker();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [customPickerOpen]);

  if (isLoading) {
    return (
      <div className="transactions-shell">
        <nav className="transactions-nav">
          <div className="transactions-nav-inner">
            <Link to="/" className="dashboard-logo">
              <span className="dashboard-logo-mark">B</span>
              <span>BrokeBuddy</span>
            </Link>
          </div>
        </nav>
        <main className="transactions-page">
          <div className="transactions-container">
            <div className="transactions-loading-shell">
              <div className="transactions-skeleton-line short" />
              <div className="transactions-skeleton-line" />
              <div className="transactions-skeleton-row" />
              <div className="transactions-skeleton-row" />
              <div className="transactions-skeleton-row" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-shell">
        <nav className="transactions-nav">
          <div className="transactions-nav-inner">
            <Link to="/" className="dashboard-logo">
              <span className="dashboard-logo-mark">B</span>
              <span>BrokeBuddy</span>
            </Link>
          </div>
        </nav>
        <main className="transactions-page">
          <div className="transactions-container">
            <div className="transactions-empty-state is-error">
              <h2>Couldn’t load transactions</h2>
              <p>{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="transactions-shell">
      <nav className="transactions-nav">
        <div className="transactions-nav-inner">
          <Link to="/" className="dashboard-logo">
            <span className="dashboard-logo-mark">B</span>
            <span>BrokeBuddy</span>
          </Link>
          <div className="transactions-nav-actions">
            <button className="transactions-secondary-btn" onClick={handleSyncTransactions} disabled={isSyncing}>
              {isSyncing ? "Syncing..." : "Sync Gmail"}
            </button>
            <button className="transactions-primary-btn" onClick={() => setIsAddModalOpen(true)}>
              + Add Transaction
            </button>
          </div>
        </div>
      </nav>

      <main className="transactions-page">
        <div className="transactions-container">
          <header className="transactions-header">
            <div>
              <p className="transactions-kicker">Transactions</p>
              <h1>Transactions</h1>
              <p className="transactions-subtitle">View and manage your income and expenses.</p>
            </div>
            <div className="transactions-header-actions">
              <button className="transactions-secondary-btn" onClick={handleSyncTransactions} disabled={isSyncing}>
                {isSyncing ? "Syncing..." : "Sync Gmail"}
              </button>
              <button className="transactions-primary-btn" onClick={() => setIsAddModalOpen(true)}>
                + Add Transaction
              </button>
            </div>
          </header>

            <div className="transactions-controls">
            <div className="transactions-search-box">
              <span className="transactions-search-icon">⌕</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
              />
            </div>

            <div className={`transactions-range-box ${selectedRange === "custom" && customStartDate && customEndDate ? 'has-custom' : ''}`}>
              <select
                value={selectedRange}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") {
                    setSelectedRange("custom");
                    setCustomPickerOpen(true);
                    // reset picker state to previously selected custom range
                    setPickerStart(customStartDate ? new Date(customStartDate) : null);
                    setPickerEnd(customEndDate ? new Date(customEndDate) : null);
                  } else {
                    setSelectedRange(v);
                    setCustomPickerOpen(false);
                  }
                }}
                aria-label="Select date range"
              >
                {recentMonths.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">Custom range</option>
              </select>
              {selectedRange === "custom" && customStartDate && customEndDate && (
                <span className="range-display">{dateRangeLabel}</span>
              )}
              {/* Clear button when a custom range is applied */}
              {selectedRange === "custom" && customStartDate && customEndDate && (
                <button
                  type="button"
                  className="range-clear-button"
                  aria-label="Clear custom range"
                  onClick={() => {
                    setCustomStartDate("");
                    setCustomEndDate("");
                    setPickerStart(null);
                    setPickerEnd(null);
                    setPickerHover(null);
                    setCustomPickerOpen(false);
                    setSelectedRange(defaultMonthValue);
                  }}
                >
                  ×
                </button>
              )}

              {customPickerOpen && (
                <div className="custom-picker-popover">
                  <div className="custom-picker-card" ref={pickerRef}>
                    {/* Minimal calendar: show current month with navigation */}
                    <Calendar
                      start={pickerStart}
                      end={pickerEnd}
                      hover={pickerHover}
                      onDayClick={(d) => {
                        if (!pickerStart || (pickerStart && pickerEnd)) {
                          setPickerStart(d);
                          setPickerEnd(null);
                        } else if (pickerStart && !pickerEnd) {
                          if (d < pickerStart) {
                            setPickerEnd(pickerStart);
                            setPickerStart(d);
                          } else {
                            setPickerEnd(d);
                          }
                        }
                      }}
                      onDayHover={(d) => setPickerHover(d)}
                    />

                    <div className="custom-picker-summary">
                      <div><strong>Start:</strong> {pickerStart ? parseISODateLocal(formatYMD(pickerStart)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                      <div><strong>End:</strong> {pickerEnd ? parseISODateLocal(formatYMD(pickerEnd)).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                    </div>

                    <div className="custom-picker-actions">
                      <button className="transactions-secondary-btn" onClick={cancelPicker}>Cancel</button>
                      <button className="transactions-primary-btn" onClick={applyPickerRange} disabled={!pickerStart || !pickerEnd}>Apply</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          { /* Custom range popover is anchored to the select; inputs removed in favor of calendar popover */ }

          <div className="transactions-filters" aria-label="Transaction filters">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`transactions-filter ${selectedFilter === filter.value ? "active" : ""}`}
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="transactions-summary-line">
            <span>{filteredTransactions.length} transactions</span>
            <span>•</span>
            <span>{formatCurrency(totalSpent)} spent</span>
            <span>•</span>
            <span>{formatCurrency(totalReceived)} received</span>
          </div>

          <div className="transactions-ledger">
            {filteredTransactions.length === 0 ? (
              <div className="transactions-empty-state">
                <h3>No transactions found</h3>
                <p>
                  Try changing your date range or filters, or add a transaction manually.
                </p>
                <div className="transactions-empty-actions">
                  <button className="transactions-primary-btn" onClick={() => setIsAddModalOpen(true)}>
                    + Add Transaction
                  </button>
                  <button className="transactions-secondary-btn" onClick={handleSyncTransactions}>
                    Sync Gmail
                  </button>
                </div>
              </div>
            ) : (
              Object.entries(groupedTransactions).map(([dayKey, items]) => (
                <div key={dayKey} className="transactions-day-group">
                  <div className="transactions-day-header">{formatDateLabel(dayKey)}</div>
                  {items.map((transaction, txIndex) => {
                    const merchant = transaction.merchant || "Unknown merchant";
                    const category = transaction.category || "General";
                    const source = transaction.source || "UPI";
                    const amount = Number(transaction.amount || 0);
                    const isExpense = !!transaction.debited;
                    const signature = isExpense ? "-" : "+";
                    const identifyingValue = transaction.upiId || transaction.merchant || "Manual";
                    const menuKey = `${transaction.id}__${dayKey}__${txIndex}`;

                    return (
                      <div key={transaction.id} className="transaction-row">
                        <div className="transaction-main">
                          <div className="transaction-icon">{merchant.charAt(0).toUpperCase()}</div>

                          <div className="transaction-info">
                            <div className="transaction-name-row">
                              <span className="transaction-name">{merchant}</span>
                            </div>
                            <div className="transaction-meta-row">
                              <span>{transaction.upiId || "Manual entry"}</span>
                              <span className="meta-separator">•</span>
                              <span>{category}</span>
                              <span className="meta-separator">•</span>
                              <span>{source}</span>
                            </div>
                          </div>
                        </div>

                        <div className="transaction-summary">
                          <span className={`transaction-amount ${isExpense ? "expense" : "income"}`}>
                            {signature}₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                          </span>
                          <span className="transaction-date">
                            {parseISODateLocal(transaction.transactionDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="transaction-actions">
                          <button
                            className="transaction-menu-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuId(showMenuId === menuKey ? null : menuKey);
                            }}
                            aria-label="Open transaction actions"
                          >
                            ⋮
                          </button>
                          {showMenuId === menuKey && ( (transaction.source === "MANUAL") || transaction.upiId ) && (
                            <div className="transaction-menu" onClick={(e) => e.stopPropagation()}>
                              {transaction.source === "MANUAL" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowMenuId(null);
                                    handleDelete(transaction.id);
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                              {transaction.upiId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowMenuId(null);
                                    handleStartEditing(transaction.id, transaction.merchant || "");
                                  }}
                                >
                                  Edit nickname
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="transactions-pagination">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Previous
              </button>

              <div className="transactions-pagination-pages">
                {(() => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    // show first two, last two, and current ±1
                    const set = new Set();
                    set.add(1);
                    set.add(2);
                    set.add(totalPages - 1);
                    set.add(totalPages);
                    set.add(currentPage - 1);
                    set.add(currentPage);
                    set.add(currentPage + 1);
                    const arr = Array.from(set).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
                    let last = 0;
                    arr.forEach((n) => {
                      if (last && n - last > 1) pages.push("...");
                      pages.push(n);
                      last = n;
                    });
                  }

                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`e-${idx}`}>…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={p === currentPage ? "active" : ""}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

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
          <div className="modal-card">
            <div className="modal-header-row">
              <h2>No Transactions Found</h2>
              <button type="button" className="modal-close" onClick={() => setIsNoTransactionsModalOpen(false)}>
                ×
              </button>
            </div>
            <p>
              We couldn’t find any transaction emails from the configured sender email. Are you sure this is the correct one?
            </p>
            <div className="modal-actions">
              <button type="button" className="transactions-primary-btn" onClick={async () => {
                setIsNoTransactionsModalOpen(false);
                const verified = await verifyBankSenderEmail();
                if (verified) toast.success("No transactions found. Your sender email has been confirmed.");
              }}>
                Yes, it’s correct
              </button>
              <button type="button" className="transactions-secondary-btn" onClick={async () => {
                await fetchBankSenderEmail();
                setIsNoTransactionsModalOpen(false);
                setPendingSyncAfterSave(true);
                setIsBankEmailModalOpen(true);
              }}>
                Change sender email
              </button>
            </div>
          </div>
        </div>
      )}

      {isSearchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-card--wide">
            <div className="modal-header-row">
              <h2>Search transactions</h2>
              <button type="button" className="modal-close" onClick={() => setIsSearchModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleSearch} className="transactions-search-form">
              <div className="form-grid">
                <label>
                  <span>Start date</span>
                  <input type="date" value={searchStartDate} onChange={(e) => setSearchStartDate(e.target.value)} />
                </label>
                <label>
                  <span>End date</span>
                  <input type="date" value={searchEndDate} onChange={(e) => setSearchEndDate(e.target.value)} min={searchStartDate} />
                </label>
                <label className="form-full">
                  <span>UPI / merchant / notes</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Swiggy or UPI ID"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="submit" className="transactions-primary-btn">Search</button>
                <button type="button" className="transactions-secondary-btn" onClick={() => setIsSearchModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-card--wide">
            <div className="modal-header-row">
              <h2>Add Transaction</h2>
              <button type="button" className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="transactions-search-form">
              <div className="form-grid">
                <label className="form-full">
                  <span>Nickname / UPI ID</span>
                  <input
                    type="text"
                    name="nicknameOrUpiId"
                    value={newExpenseData.nicknameOrUpiId}
                    onChange={handleAddFormChange}
                    placeholder="Enter nickname or UPI ID"
                    required
                  />
                </label>
                <label>
                  <span>Amount</span>
                  <input
                    type="number"
                    name="amount"
                    value={newExpenseData.amount}
                    onChange={handleAddFormChange}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </label>
                <label>
                  <span>Date</span>
                  <input type="date" name="date" value={newExpenseData.date} onChange={handleAddFormChange} required />
                </label>
                <div className="form-full form-radio-wrap">
                  <span>Type</span>
                  <div className="radio-row">
                    <label>
                      <input
                        type="radio"
                        name="debited"
                        value="true"
                        checked={newExpenseData.debited === true}
                        onChange={handleAddFormChange}
                      />
                      Debit (-)
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="debited"
                        value="false"
                        checked={newExpenseData.debited === false}
                        onChange={handleAddFormChange}
                      />
                      Credit (+)
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="transactions-primary-btn">Save Transaction</button>
                <button type="button" className="transactions-secondary-btn" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
