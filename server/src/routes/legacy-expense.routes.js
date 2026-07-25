import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import * as transactionService from "../services/transaction.service.js";

const router = express.Router();

router.use(protectRoute);

const formatTransaction = (transaction) => ({
  id: transaction.id,
  COST: transaction.amount,
  UPI_ID: transaction.upiId || transaction.merchant || "",
  DEBITED: transaction.debited,
  date: `${transaction.transactionDate.getDate()}-${transaction.transactionDate.toLocaleString(
    "en-US",
    { month: "short" }
  )}-${transaction.transactionDate.getFullYear()}`,
  source: transaction.source,
  category: transaction.category,
  notes: transaction.notes,
});

const formatResponse = (transactions) => ({
  Transactions: transactions.map(formatTransaction),
});

router.post("/getExp", async (req, res) => {
  try {
    const transactions = await transactionService.getTransactions(req.user.id);
    return res.json(formatResponse(transactions));
  } catch (error) {
    console.error("Legacy expense fetch error:", error);
    return res.status(500).json({
      msg: "Failed to fetch expenses.",
      error: error.message,
    });
  }
});

router.post("/search", async (req, res) => {
  try {
    const transactions = await transactionService.searchTransactions(
      req.user.id,
      req.body
    );

    return res.json(formatResponse(transactions));
  } catch (error) {
    console.error("Legacy expense search error:", error);
    return res.status(500).json({
      msg: "Failed to search expenses.",
      error: error.message,
    });
  }
});

router.post("/add", async (req, res) => {
  try {
    const transaction = await transactionService.createTransaction(req.user.id, {
      amount: req.body.amount,
      debited: req.body.debited,
      transactionDate: req.body.date,
      upiId: req.body.nicknameOrUpiId,
    });

    return res.status(201).json(formatTransaction(transaction));
  } catch (error) {
    console.error("Legacy expense add error:", error);
    return res.status(500).json({
      msg: "Failed to add expense.",
      error: error.message,
    });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    await transactionService.deleteTransaction(req.user.id, req.params.id);
    return res.json({ msg: "Expense deleted successfully." });
  } catch (error) {
    console.error("Legacy expense delete error:", error);
    return res.status(500).json({
      msg: "Failed to delete expense.",
      error: error.message,
    });
  }
});

export default router;
