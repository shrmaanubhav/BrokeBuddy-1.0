import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNicknames,
  saveNickname,
} from "../controllers/nickname.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getNicknames);
router.post("/", saveNickname);

export default router;