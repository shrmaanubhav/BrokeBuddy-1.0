import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import { getExpenses } from "../controllers/expense.conroller.js";
const router = express.Router();

router.post("/getExp", getExpenses);

export default router;
