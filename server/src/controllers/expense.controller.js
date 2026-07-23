import * as expenseService from "../services/expense.service.js";

export const getExpenses = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const mergedData = await expenseService.getRecentExpenses(email);
    return res.status(200).json(mergedData);
  } catch (error) {
    console.error("Error inside getExpenses:", error);
    return res.status(400).json({ message: "Error in fetching expenses", error: error.message });
  }
};

export const searchExpenses = async (req, res) => {
  const { email, startDate, endDate, query } = req.body;
  try {
    if (!email || !startDate) {
      return res.status(400).json({ message: "Email and Start Date are required" });
    }

    const searchResults = await expenseService.searchUserExpenses(email, startDate, endDate, query);
    return res.status(200).json(searchResults);
  } catch (error) {
    console.error("Error searching expenses:", error);
    return res.status(500).json({ message: "Error searching expenses", error: error.message });
  }
};

export const addExpenses = async (req, res) => {
  const { email, nicknameOrUpiId, amount, debited, date } = req.body;
  try {
    if (!email || !nicknameOrUpiId || !amount || debited === undefined || !date) {
      return res.status(400).json({ msg: "Insufficient information" });
    }

    const newTransaction = await expenseService.createManualExpense(email, nicknameOrUpiId, amount, debited, date);
    return res.status(201).json({ msg: "Transaction added successfully", newTransaction });
  } catch (error) {
    if (error.message === "INVALID_DATE_FORMAT") {
      return res.status(400).json({ msg: "Invalid date format received" });
    }
    console.error("Error in addExpenses catch block:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const delExpense = async (req, res) => {
  const { id } = req.params;
  const userEmail = req.query.email; // Note: You pulled this from query params in the original
  try {
    if (!userEmail) {
      return res.status(400).json({ msg: "User email is required for authorization" });
    }

    await expenseService.deleteUserExpense(id, userEmail);
    return res.status(200).json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    if (error.message === "TRANSACTION_NOT_FOUND") return res.status(404).json({ msg: "Transaction not found" });
    if (error.message === "UNAUTHORIZED") return res.status(403).json({ msg: "Not authorized to delete this transaction" });
    
    console.error("Error deleting transaction:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};