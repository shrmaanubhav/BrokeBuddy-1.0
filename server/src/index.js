import express from "express";
import cors from "cors";
import "./config/env.js";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";

import prisma from "./lib/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
// import legacyExpenseRoutes from "./routes/legacy-expense.routes.js";
import nicknameRoutes from "./routes/nickname.routes.js";
import profileRoutes from "./routes/profile.routes.js";

// dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(passport.initialize());

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options(/.*/, cors());

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
// app.use("/api/expense", legacyExpenseRoutes);
app.use("/api/nicknames", nicknameRoutes);
app.use("/api/profile", profileRoutes);

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
