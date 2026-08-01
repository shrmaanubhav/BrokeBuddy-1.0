import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getBankSenderEmail,
  updateBankSenderEmail,
  verifyBankSenderEmail,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/bank-email", protectRoute, getBankSenderEmail);
router.put("/bank-email", protectRoute, updateBankSenderEmail);
router.post("/bank-email/verify", protectRoute, verifyBankSenderEmail);

export default router;
