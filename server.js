import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import ConnectDB from "./db.js";
import authRoutes from "./routes/auth.js";
import expenseRoutes from "./routes/expense.routes.js";
import nicknameRoutes from "./routes/nicknameRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

const app = express();

app.use(cookieParser());

app.use(express.json());

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options(/.*/, cors());

ConnectDB();

app.get("/", (req, res) => res.send("Backend is working!"));

app.use("/api/auth", authRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/nicknames", nicknameRoutes);
app.use("/api/profile", profileRoutes);

app.listen(4000, () => console.log("🚀 Server running on port 4000"));
