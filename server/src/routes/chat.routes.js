import express from "express";

import { protectRoute } from "../middleware/auth.middleware.js";
import * as chatController from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", protectRoute, chatController.chat);

export default router;