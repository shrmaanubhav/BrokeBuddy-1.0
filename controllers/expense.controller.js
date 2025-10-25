import Nickname from "../models/Nickname.js";
import manualTransaction from "../models/manualTransaction.js";

const fetchExpensesFromPython = async (email, startDate, endDate) => {
  const data = { email, date: startDate, endDate };

  const resp = await fetch("http://localhost:8000/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    throw new Error(`Python service failed with status ${resp.status}`);
  }

  return resp.json();
};

// merge python and database transaction
const mergeAndSort = async (email, startDate, endDate, pyData) => {
  const py_Tr = (pyData?.Transactions || []).map((t) => ({
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

  const allTr = [...py_Tr, ...manualTr];

  allTr.sort((a, b) => b.date - a.date);

  return {
    ...pyData,
    Transactions: allTr,
  };
};

export const getExpenses = async (req, res) => {
  const { email } = req.body;

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

    if (!query || query.trim() === "") {
      return res.status(200).json(expenseData);
    }

    const nicknamesList = await Nickname.find({ userEmail: email });
    const nicknamesMap = nicknamesList.reduce((acc, item) => {
      acc[item.upiId] = item.nickname;
      return acc;
    }, {});

    const queryLower = query.toLowerCase();

    const filteredTransactions = expenseData.Transactions.filter(
      (transaction) => {
        const upiId = transaction.UPI_ID.toLowerCase();
        const nickname = nicknamesMap[transaction.UPI_ID]?.toLowerCase();

        if (upiId.includes(queryLower)) return true;
        if (nickname && nickname.includes(queryLower)) return true;

        return false;
      }
    );

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
  const userEmail = req.body.email;

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

    res.status(200).json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};
