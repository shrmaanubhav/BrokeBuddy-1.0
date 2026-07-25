import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  getExpenses,
  searchExpenses,
  addExpenses,
  delExpense,
} from "../controllers/expense.controller.js";
const router = express.Router();

router.post("/getExp", getExpenses);
router.post("/search", searchExpenses);
router.post("/add", addExpenses);
router.delete("/delete/:id", delExpense);

export default router;
