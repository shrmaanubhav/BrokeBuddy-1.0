import User from "../models/user.model.js";
import Nickname from "../models/nickname.model.js";
import manualTransaction from "../models/manual-transaction.model.js";
import onlineTransaction from "../models/online-transaction.model.js";
import bcrypt from "bcrypt";
import { buildAgentContext } from "./agent-context.service.js";

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const updateUserName = async (userId, newName) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  user.name = newName.trim();
  await user.save();
  return user.name;
};

export const updateUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error("INCORRECT_PASSWORD");

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  user.password = hashedNewPassword;
  await user.save();
};

export const deleteUserAccount = async (userId, userEmail) => {
  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) throw new Error("USER_NOT_FOUND");

  // Cascade delete associated data
  await Nickname.deleteMany({ userEmail: userEmail });
  await manualTransaction.deleteMany({ userEmail: userEmail });
};

export const syncUserData = async (email) => {
  // 1. Calculate the date 60 days ago
  const date = new Date();
  date.setDate(date.getDate() - 60);
  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const date_2mon = `${day}-${month}-${year}`;

  // 2. Fetch from Python backend
  const resp = await fetch(`http://localhost:8000/expense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, date: date_2mon })
  });
  
  const data = await resp.json();
  const transactions = data.Transactions || [];

  // 3. Format and Bulk Write to MongoDB
  const formattedTxns = transactions.map((txn) => ({
    userEmail: email,
    UPI_ID: txn.UPI_ID,
    nickname: txn.nicknameId,
    COST: txn.COST,
    DEBITED: txn.DEBITED,
    date: txn.date
  }));

  const bulkOps = formattedTxns.map((txn) => ({
    updateOne: {
      filter: { userEmail: txn.userEmail, UPI_ID: txn.UPI_ID, COST: txn.COST, date: txn.date },
      update: {
        $setOnInsert: {
          userEmail: email,
          UPI_ID: txn.UPI_ID,
          COST: txn.COST,
          DEBITED: txn.DEBITED,
          date: txn.date,
        }
      },
      upsert: true
    }
  }));

  if (bulkOps.length > 0) {
    await onlineTransaction.bulkWrite(bulkOps);
  }

  // 4. Build Agent JSON and sync back to Python
  const formatted = await buildAgentJson(email);
  
  await fetch("http://localhost:8000/updateData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions: formatted }),
  });
};