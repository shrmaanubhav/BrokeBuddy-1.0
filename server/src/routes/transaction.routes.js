import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getTransactions,
  searchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();

router.use(protectRoute);
router.get("/", getTransactions);
router.get("/search", searchTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;