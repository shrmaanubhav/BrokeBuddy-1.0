import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  changeName,
  deleteAccount,
  getMyProfile,
  syncTransactions,
} from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/me", protectRoute, getMyProfile);
router.post("/name", protectRoute, changeName);
router.post("/sync-transactions", protectRoute, syncTransactions);
router.delete("/account", protectRoute, deleteAccount);

export default router;