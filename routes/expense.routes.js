import express from "express"
import {protectRoute} from '../middleware/auth.middleware.js'
import { getExpenses } from "../controllers/expense.conroller.js";
const router = express.Router()

router.post("/getExp",getExpenses);

export default router;