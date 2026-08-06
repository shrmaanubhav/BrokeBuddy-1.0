import express from "express";
import cors from "cors";
import "./config/env.js";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";

import prisma from "./lib/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import nicknameRoutes from "./routes/nickname.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

const normalizeOrigin = (origin) => origin?.replace(/\/$/, "");

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .map(normalizeOrigin);

console.log("Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = normalizeOrigin(origin);

    console.log("Incoming Origin:", origin);
    console.log("Normalized Origin:", normalizedOrigin);

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error("❌ Blocked Origin:", normalizedOrigin);

    return callback(new Error("CORS not allowed"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.get("/health", (_, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/nicknames", nicknameRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to PostgreSQL");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL");
    console.error(err);
    process.exit(1);
  }
}

startServer();