import Nickname from "../models/nickname.model.js";
import manualTransaction from "../models/manual-transaction.model.js";
import onlineTransaction from "../models/online-transaction.model.js";

// --- Internal Helpers ---

const parseDateString = (str) => {
  if (!str) return null;
  const [day, mon, year] = str.split("-");
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const m = months[mon];
  if (m === undefined || !year || !day) return null;
  return new Date(Number(year), m, Number(day));
};

const fetchOnlineExpenses = async (email, startDate, endDate) => {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  
  const docs = await onlineTransaction.find({ userEmail: email });
  
  return docs.filter((doc) => {
    const docDate = parseDateString(doc.date);
    return docDate && docDate >= start && docDate <= end;
  });
};

const mergeAndSort = async (email, startDate, endDate, pyData) => {
  const py_Tr = (pyData || []).map((t) => ({
    ...t,
    date: new Date(t.date),
    isManual: false,
  }));

  const manualDbTr = await manualTransaction.find({
    userEmail: email,
    date: {
      $gte: new Date(startDate.replace(/-/g, " ")),
      $lte: new Date(endDate.replace(/-/g, " ")),
    },
  });

  const manualTr = manualDbTr.map((t) => ({
    _id: t._id,
    COST: t.COST,
    UPI_ID: t.UPI_ID,
    DEBITED: t.DEBITED,
    date: t.date,
    isManual: true,
  }));

  let allTr = [...py_Tr, ...manualTr].map((t) => {
    const obj = t._doc || t;
    return {
      _id: obj._id,
      COST: obj.COST,
      UPI_ID: obj.UPI_ID,
      DEBITED: obj.DEBITED,
      date: obj.date instanceof Date ? obj.date : new Date(obj.date),
      isManual: t.isManual ?? false,
    };
  });

  allTr.sort((a, b) => b.date - a.date);
  return { Transactions: allTr };
};

const getFormattedDate = (dateObj) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dateObj.getDate()}-${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`;
};

// --- Exported Business Logic ---

export const getRecentExpenses = async (email) => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const endDate = getFormattedDate(today);
  const startDate = getFormattedDate(sevenDaysAgo);

  const pyData = await fetchOnlineExpenses(email, startDate, endDate);
  return await mergeAndSort(email, startDate, endDate, pyData);
};

export const searchUserExpenses = async (email, startDate, providedEndDate, query) => {
  const endDate = providedEndDate || getFormattedDate(new Date());

  const pyData = await fetchOnlineExpenses(email, startDate, endDate);
  const expenseData = await mergeAndSort(email, startDate, endDate, pyData);

  if (!query || query.trim() === "") {
    return expenseData;
  }

  const nicknamesList = await Nickname.find({ userEmail: email });
  const nicknamesMap = nicknamesList.reduce((acc, item) => {
    acc[item.upiId.toLowerCase()] = item.nickname;
    return acc;
  }, {});

  const queryLower = query.toLowerCase();
  const filteredTransactions = (expenseData.Transactions || []).filter((transaction) => {
    const upiIdRaw = transaction.UPI_ID || transaction._doc?.UPI_ID || "";
    const upiId = upiIdRaw.toLowerCase();
    const nickname = nicknamesMap[upiId]?.toLowerCase() || "";
    
    return nickname.includes(queryLower) || upiId.includes(queryLower);
  });

  return { ...expenseData, Transactions: filteredTransactions };
};

export const createManualExpense = async (email, nicknameOrUpiId, amount, debited, date) => {
  const transactionDate = new Date(date);
  if (isNaN(transactionDate)) throw new Error("INVALID_DATE_FORMAT");

  const nicknameEntry = await Nickname.findOne({ userEmail: email, nickname: nicknameOrUpiId });
  const upiIdToSave = nicknameEntry ? nicknameEntry.upiId : nicknameOrUpiId;

  const newTransaction = new manualTransaction({
    userEmail: email,
    UPI_ID: upiIdToSave,
    COST: parseFloat(amount),
    DEBITED: Boolean(debited),
    date: transactionDate,
  });

  return await newTransaction.save();
};

export const deleteUserExpense = async (id, userEmail) => {
  const transaction = await manualTransaction.findById(id);
  if (!transaction) throw new Error("TRANSACTION_NOT_FOUND");
  if (transaction.userEmail !== userEmail) throw new Error("UNAUTHORIZED");

  await manualTransaction.findByIdAndDelete(id);
};