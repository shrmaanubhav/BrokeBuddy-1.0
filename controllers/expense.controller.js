import Nickname from "../models/Nickname.js";

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

    const expenseData = await fetchExpensesFromPython(
      email,
      startDate,
      endDate
    );

    return res.status(200).json(expenseData);
  } catch (error) {
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
    const expenseData = await fetchExpensesFromPython(
      email,
      startDate,
      effectiveEndDate
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
