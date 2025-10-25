import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  changeUsername,
  changePassword,
  deleteAccount,
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/username", protectRoute, changeUsername);
router.post("/password", protectRoute, changePassword);
router.delete("/account", protectRoute, deleteAccount);

export default router;
