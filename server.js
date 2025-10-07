import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ConnectDB from "./db.js";
import authRoutes from "./routes/auth.js";
import expenseRoutes from "./routes/expense.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Define allowed origins
const allowedOrigins = [
  "http://localhost:5173", // Vite React
  "http://localhost:3000", // CRA React
];

// ✅ CORS middleware (handle all preflights globally)
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

// ✅ This explicitly handles all OPTIONS preflight requests
app.options(/.*/, cors());


// ✅ Connect to DB
ConnectDB();

// ✅ Health check
app.get("/", (req, res) => res.send("Backend is working!"));

// ✅ Your routes
app.use("/api/auth", authRoutes);
app.use("/api/expense", expenseRoutes);

// ✅ Start server
app.listen(4000, () => console.log("🚀 Server running on port 4000"));
