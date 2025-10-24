import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  getExpenses,
  searchExpenses,
} from "../controllers/expense.controller.js";
const router = express.Router();

router.post("/getExp", getExpenses);
router.post("/search", searchExpenses);

export default router;
