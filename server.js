import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ConnectDB from "./db.js";
import authRoutes from "./routes/auth.js";
import expenseRoutes from "./routes/expense.routes.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

ConnectDB();

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.use("/api/auth", authRoutes);
app.use("/api/expense", expenseRoutes);

app.listen(4000, () => {
  console.log(`Server running on port 4000`);
});
