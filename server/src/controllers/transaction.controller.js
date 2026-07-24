import * as transactionService from "../services/transaction.service.js";

export const getTransactions = async (req, res) => {
  try {
    const transactions = await transactionService.getTransactions(
      req.user.id
    );

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);

    return res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

export const searchTransactions = async (req, res) => {
  try {
    const transactions = await transactionService.searchTransactions(
      req.user.id,
      req.query
    );

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error searching transactions:", error);

    return res.status(500).json({
      message: "Failed to search transactions",
      error: error.message,
    });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.createTransaction(
      req.user.id,
      req.body
    );

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);

    switch (error.message) {
      case "INVALID_DATE":
        return res.status(400).json({
          message: "Invalid transaction date",
        });

      default:
        return res.status(500).json({
          message: "Failed to create transaction",
          error: error.message,
        });
    }
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.user.id,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);

    switch (error.message) {
      case "TRANSACTION_NOT_FOUND":
        return res.status(404).json({
          message: "Transaction not found",
        });

      case "EMAIL_TRANSACTION_READ_ONLY":
        return res.status(403).json({
          message: "Email imported transactions cannot be modified",
        });

      default:
        return res.status(500).json({
          message: "Failed to update transaction",
          error: error.message,
        });
    }
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    await transactionService.deleteTransaction(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);

    switch (error.message) {
      case "TRANSACTION_NOT_FOUND":
        return res.status(404).json({
          message: "Transaction not found",
        });

      case "EMAIL_TRANSACTION_READ_ONLY":
        return res.status(403).json({
          message: "Email imported transactions cannot be deleted",
        });

      default:
        return res.status(500).json({
          message: "Failed to delete transaction",
          error: error.message,
        });
    }
  }
};