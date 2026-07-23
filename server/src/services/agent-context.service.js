import OnlineTransaction from "../models/online-transaction.model.js";
import Nickname from "../models/nickname.model.js";

export const buildAgentContext = async (email) => {
  const transactions = await OnlineTransaction.find({
    userEmail: email,
  }).lean();

  const nicknames = await Nickname.find({
    userEmail: email,
  }).lean();

  const nicknameMap = new Map();

  for (const nickname of nicknames) {
    nicknameMap.set(
      nickname.upiId.toLowerCase(),
      nickname.nickname
    );
  }

  return transactions.map((tx) => ({
    Status: tx.DEBITED ? "DEBITED" : "CREDITED",
    Id: tx._id.toString(),
    UPI_id: tx.UPI_ID,
    Name:
      nicknameMap.get(tx.UPI_ID.toLowerCase()) ??
      tx.UPI_ID.match(/^[A-Za-z0-9]+/)?.[0] ??
      "Unknown",
    Balance: tx.balance ?? 0,
    Transaction_Amount: tx.COST,
    Date: tx.date,
    Category: tx.category ?? "Uncategorized",
  }));
};