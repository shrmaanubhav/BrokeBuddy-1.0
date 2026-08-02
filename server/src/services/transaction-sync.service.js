import prisma from "../lib/prisma.js";
import { TransactionSource } from "@prisma/client";

import * as parserService from "./parser.service.js";

const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseTransactionDate(dateStr) {
  if (!dateStr) return null;

  const [day, month, year] = dateStr.split("-");

  // Always normalize to UTC midnight
  return new Date(Date.UTC(Number(year), MONTHS[month], Number(day)));
}

export const syncUserData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      bankSenderEmail: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const date = new Date();
  date.setDate(date.getDate() - 60);

  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  const date_2mon = `${day}-${month}-${year}`;

  if (!user.bankSenderEmail) {
    throw new Error("BANK_SENDER_EMAIL_NOT_CONFIGURED");
  }

  const transactions = await parserService.parseExpenses({
    userId,
    email: user.email,
    date: date_2mon,
    bankSenderEmail: user.bankSenderEmail,
  });

  const formattedTransactions = transactions.map((txn) => ({
    userId,
    source: TransactionSource.EMAIL,
    amount: Number(txn.COST),
    debited: txn.DEBITED,
    transactionDate: parseTransactionDate(txn.date),
    upiReference: txn.UPI_REFERENCE?.trim() || null,
    upiId: txn.UPI_ID?.trim().toLowerCase() || null,
    merchant: txn.nicknameId?.trim() || null,
  }));

  let inserted = 0;

  if (formattedTransactions.length > 0) {
    const result = await prisma.transaction.createMany({
      data: formattedTransactions,
      skipDuplicates: true,
    });

    inserted = result.count ?? 0;
  }

  return {
    inserted,
    skipped: formattedTransactions.length - inserted,
    total: formattedTransactions.length,
  };
};