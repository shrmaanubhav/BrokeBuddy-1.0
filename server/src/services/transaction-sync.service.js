import prisma from "../lib/prisma.js";
import { TransactionSource } from "@prisma/client";
import { buildAgentContext } from "./agent-context.service.js";

export const syncUserData = async (userId, email) => {
  // Calculate date 60 days ago
  const date = new Date();
  date.setDate(date.getDate() - 60);

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  const date_2mon = `${day}-${month}-${year}`;

  // Fetch transactions from Python backend
  const resp = await fetch("http://localhost:5000/expense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      email,
      date: date_2mon,
    }),
  });

  if (!resp.ok) {
    throw new Error("FAILED_TO_FETCH_TRANSACTIONS");
  }

  const data = await resp.json();

  const transactions = data.Transactions || [];

  if (transactions.length > 0) {
    await prisma.transaction.createMany({
      data: transactions.map((txn) => ({
        userId,

        source: TransactionSource.EMAIL,

        amount: Number(txn.COST),

        debited: txn.DEBITED,

        transactionDate: new Date(txn.date),

        upiId: txn.UPI_ID?.trim().toLowerCase() || null,

        merchant: txn.nicknameId?.trim() || null,
      })),
      skipDuplicates: true,
    });
  }

  const formatted = await buildAgentContext(userId);

  await fetch("http://localhost:5000/updateData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactions: formatted,
    }),
  });
};
