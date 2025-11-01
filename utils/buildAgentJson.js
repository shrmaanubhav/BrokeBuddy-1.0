import onlineTransaction from "../models/onlineTransaction.js";
import Nickname from "../models/Nickname.js";

export const buildAgentJson = async (email) => {
  
  const mongoTxs = await onlineTransaction.find({ userEmail: email }).lean();
  const nicknames = await Nickname.find({ userEmail: email }).lean();

  
  const nicknameMap = {};
  for (const n of nicknames) {
    nicknameMap[n.upiId.toLowerCase()] = n.nickname;
  }

  
  const formatted = mongoTxs.map((tx) => ({
    Status: tx.DEBITED ? "DEBITED" : "CREDITED",
    Id: tx._id.toString(),
    UPI_id: tx.UPI_ID,
    Name:
      nicknameMap[tx.UPI_ID.toLowerCase()] ||
      (tx.UPI_ID.match(/^[A-Za-z0-9]+/)?.[0] || "Unknown"),
    Balance: tx.balance || 0,
    Transaction_Amount: tx.COST,
    Date: tx.date,
    Category: tx.category || "Uncategorized",
  }));

  return formatted;
};
