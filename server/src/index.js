import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import prisma from "./lib/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import nicknameRoutes from "./routes/nickname.routes.js";
import profileRoutes from "./routes/profile.routes.js";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:3001",
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
app.use("/api/expense", expenseRoutes);
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