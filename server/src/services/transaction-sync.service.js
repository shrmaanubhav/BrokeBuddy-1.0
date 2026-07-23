import onlineTransaction from "../models/online-transaction.model.js";
import { buildAgentContext } from "./agent-context.service.js";

export const syncUserData = async (email) => {
  // Calculate the date 60 days ago
  const date = new Date();
  date.setDate(date.getDate() - 60);

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  const date_2mon = `${day}-${month}-${year}`;

  // Fetch expenses from Python backend
  const resp = await fetch("http://localhost:8000/expense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      date: date_2mon,
    }),
  });

  const data = await resp.json();

  const transactions = data.Transactions || [];

  const formattedTxns = transactions.map((txn) => ({
    userEmail: email,
    UPI_ID: txn.UPI_ID,
    nickname: txn.nicknameId,
    COST: txn.COST,
    DEBITED: txn.DEBITED,
    date: txn.date,
  }));

  const bulkOps = formattedTxns.map((txn) => ({
    updateOne: {
      filter: {
        userEmail: txn.userEmail,
        UPI_ID: txn.UPI_ID,
        COST: txn.COST,
        date: txn.date,
      },
      update: {
        $setOnInsert: {
          userEmail: email,
          UPI_ID: txn.UPI_ID,
          COST: txn.COST,
          DEBITED: txn.DEBITED,
          date: txn.date,
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await onlineTransaction.bulkWrite(bulkOps);
  }

  const formatted = await buildAgentContext(email);

  await fetch("http://localhost:8000/updateData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactions: formatted,
    }),
  });
};