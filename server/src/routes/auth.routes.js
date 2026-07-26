import express from "express";
import passport from "passport";
import prisma from "../lib/prisma.js";
import { googleCallback, logout } from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
/* ---------------- Google OAuth ---------------- */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  googleCallback
);

/* ---------------------------------------------- */

router.get("/checkAuth", protectRoute, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      msg: "Server error",
    });
  }
});

router.post("/logout", logout);

export default router;