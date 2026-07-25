import prisma from "../lib/prisma.js";
import { TransactionSource } from "@prisma/client";

export const buildAgentContext = async (userId) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      source: TransactionSource.EMAIL,
    },
    select: {
      id: true,
      debited: true,
      upiId: true,
      merchant: true,
      amount: true,
      transactionDate: true,
      category: true,
    },
    orderBy: {
      transactionDate: "desc",
    },
  });

  const nicknames = await prisma.nickname.findMany({
    where: {
      userId,
    },
    select: {
      upiId: true,
      nickname: true,
    },
  });

  const nicknameMap = new Map();

  for (const nickname of nicknames) {
    nicknameMap.set(
      nickname.upiId.toLowerCase(),
      nickname.nickname
    );
  }

  return transactions.map((tx) => ({
    Status: tx.debited ? "DEBITED" : "CREDITED",

    Id: tx.id,

    UPI_id: tx.upiId,

    Name:
      nicknameMap.get(tx.upiId?.toLowerCase()) ??
      tx.merchant ??
      tx.upiId?.match(/^[A-Za-z0-9]+/)?.[0] ??
      "Unknown",

    Balance: 0,

    Transaction_Amount: tx.amount,

    Date: tx.transactionDate,

    Category: tx.category,
  }));
};