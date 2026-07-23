import express from "express";
const router = express.Router();

import {
  signup,
  login,
  logout,
  verifyOTP,
  sendOTP,
  resetPass,
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verifyOTP", verifyOTP);
router.post("/sendOTP", sendOTP);
router.post("/resetPass", resetPass);

router.get("/checkAuth", protectRoute, (req, res) => {
  res.json({ msg: "Welcome!", userId: req.user.id });
});

export default router;
