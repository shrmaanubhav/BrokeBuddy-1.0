import Nickname from "../models/Nickname.js";
import manualTransaction from "../models/manualTransaction.js";
import onlineTransaction from "../models/onlineTransaction.js";

const fetchExpensesFromPython = async (email, startDate, endDate) => {
  const data = { email, date: startDate, endDate };
  console.log("Fetching expenses from Python with data:", data);

  // Helper to parse "17-Oct-2025" safely
  const parseDate = (str) => {
    if (!str) return null; // skip invalid
    const [day, mon, year] = str.split("-");
    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const m = months[mon];
    if (m === undefined || !year || !day) return null;
    return new Date(Number(year), m, Number(day));
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const docs = await onlineTransaction.find({ userEmail: email });

  // Filter safely with null checks
  const filtered = docs.filter((doc) => {
    const docDate = parseDate(doc.date);
    return docDate && docDate >= start && docDate <= end;
  });

  return filtered;
};

  // const resp = await fetch("http://localhost:8000/expense", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(data),
  // });

  

// merge python and database transaction
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

  
  let allTr = [...py_Tr, ...manualTr];

  allTr = allTr.map((t) => {
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

  console.log("Merged and sorted transactions:", allTr);
  return {
   
    Transactions: allTr,
  };


};

export const getExpenses = async (req, res) => {
  const { email } = req.body;
  console.log("getExpenses called with email:", email);
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

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

    const endDate = `${today.getDate()}-${
      months[today.getMonth()]
    }-${today.getFullYear()}`;
    const startDate = `${sevenDaysAgo.getDate()}-${
      months[sevenDaysAgo.getMonth()]
    }-${sevenDaysAgo.getFullYear()}`;

    const pyData = await fetchExpensesFromPython(email, startDate, endDate);

    const mergedData = await mergeAndSort(email, startDate, endDate, pyData);

    return res.status(200).json(mergedData);
  } catch (error) {
    console.error("Error inside getExpenses:", error);

    return res
      .status(400)
      .json({ message: "Error in fetching expenses", error: error.message });
  }
};

export const searchExpenses = async (req, res) => {
  const { email, startDate, endDate, query } = req.body;

  if (!email || !startDate) {
    return res
      .status(400)
      .json({ message: "Email and Start Date are required" });
  }

  let effectiveEndDate = endDate;
  if (!effectiveEndDate) {
    const today = new Date();
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
    effectiveEndDate = `${today.getDate()}-${
      months[today.getMonth()]
    }-${today.getFullYear()}`;
  }

  try {
    const pyData = await fetchExpensesFromPython(
      email,
      startDate,
      effectiveEndDate
    );
    const expenseData = await mergeAndSort(
      email,
      startDate,
      effectiveEndDate,
      pyData
    );
    // console.log("Expense data fetched for search:", expenseData);
    // console.log(pyData)

    if (!query || query.trim() === "") {
      return res.status(200).json(expenseData);
    }

    const nicknamesList = await Nickname.find({ userEmail: email });
    const nicknamesMap = nicknamesList.reduce((acc, item) => {
      acc[item.upiId.toLowerCase()] = item.nickname;
      return acc;
    }, {});
    
    const queryLower = query.toLowerCase();

    const filteredTransactions = (expenseData.Transactions || []).filter((transaction) => {
  // Extract and normalize UPI_ID
  const upiIdRaw = transaction.UPI_ID || transaction._doc?.UPI_ID || "";
  const upiId = upiIdRaw.toLowerCase();

  // Lookup nickname safely (keys are lowercase now)
  const nickname = nicknamesMap[upiId]?.toLowerCase() || "";

  // Log for clarity
  console.log("UPI:", upiIdRaw, "| Nickname:", nickname);

  // Return only matches
  return nickname.includes(queryLower) || upiId.includes(queryLower);
});

    console.log(filteredTransactions)
    return res.status(200).json({
      ...expenseData,
      Transactions: filteredTransactions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error searching expenses", error: error.message });
  }
};

export const addExpenses = async (req, res) => {
  const { email, nicknameOrUpiId, amount, debited, date } = req.body;

  try {
    if (
      !email ||
      !nicknameOrUpiId ||
      !amount ||
      debited === undefined ||
      !date
    ) {
      return res.status(400).json({ msg: "Insufficient information" });
    }

    let upiIdToSave;

    const nicknameEntry = await Nickname.findOne({
      userEmail: email,
      nickname: nicknameOrUpiId,
    });

    if (nicknameEntry) {
      upiIdToSave = nicknameEntry.upiId;
    } else {
      upiIdToSave = nicknameOrUpiId;
    }

    const transactionDate = new Date(date);
    if (isNaN(transactionDate)) {
      throw new Error("Invalid date format received");
    }

    const newTransaction = new manualTransaction({
      userEmail: email,
      UPI_ID: upiIdToSave,
      COST: parseFloat(amount),
      DEBITED: Boolean(debited),
      date: transactionDate,
    });

    await newTransaction.save();

    res
      .status(201)
      .json({ msg: "Transaction added successfully", newTransaction });
  } catch (error) {
    console.error("Error in addExpenses catch block:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const delExpense = async (req, res) => {
  const { id } = req.params;
  const userEmail = req.query.email;

  try {
    const transaction = await manualTransaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    if (transaction.userEmail !== userEmail) {
      return res
        .status(403)
        .json({ msg: "Not authorized to delete this transaction" });
    }

    await manualTransaction.findByIdAndDelete(id);

    return res.status(200).json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};
