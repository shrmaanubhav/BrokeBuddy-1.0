import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  changeName,
  changePassword,
  deleteAccount,
  getMyProfile,
  updateUserData,
} from "../controllers/profileController.js";

const router = express.Router();
router.get("/me", protectRoute, getMyProfile);
router.post("/name", protectRoute, changeName);
router.post("/password", protectRoute, changePassword);
router.delete("/account", protectRoute, deleteAccount);
router.post("/data",protectRoute,updateUserData)

export default router;
