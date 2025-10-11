import express from "express";
import {
  getNicknames,
  saveNickname,
} from "../controllers/nicknameController.js";

const router = express.Router();

router.post("/get", getNicknames);
router.post("/save", saveNickname);

export default router;
