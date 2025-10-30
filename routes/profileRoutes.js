import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  changeName,
  changePassword,
  deleteAccount,
} from "../controllers/profileController.js";

const router = express.Router();

router.post("/name", protectRoute, changeName);
router.post("/password", protectRoute, changePassword);
router.delete("/account", protectRoute, deleteAccount);

export default router;
