import prisma from "../lib/prisma.js";
import { TransactionSource, ExpenseCategory } from "@prisma/client";
/**
 * Returns  transactions.
 */
export const getTransactions = async (userId) => {
  return prisma.transaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      transactionDate: "desc",
    },
  });
};

/**
 * Search transactions using optional filters.
 */
export const searchTransactions = async (
  userId,
  filters = {}
) => {
  const {
    startDate,
    endDate,
    category,
    source,
    debited,
    query,
  } = filters;

  const where = {
    userId,
  };

  if (startDate || endDate) {
    where.transactionDate = {};

    if (startDate) {
      where.transactionDate.gte = new Date(startDate);
    }

    if (endDate) {
      where.transactionDate.lte = new Date(endDate);
    }
  }

  if (category) {
    where.category = category;
  }

  if (source) {
    where.source = source;
  }

  if (debited !== undefined) {
    where.debited =
      debited === true || debited === "true";
  }

  if (query) {
    where.OR = [
      {
        merchant: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        upiId: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        notes: {
          contains: query,
          mode: "insensitive",
        },
      },
    ];
  }

  return prisma.transaction.findMany({
    where,
    orderBy: {
      transactionDate: "desc",
    },
  });
};

/**
 * Create a manual transaction.
 */
export const createTransaction = async (
  userId,
  data
) => {
  return prisma.transaction.create({
    data: {
      userId,

      source: TransactionSource.MANUAL,

      amount: Number(data.amount),

      debited: data.debited,

      transactionDate: new Date(
        data.transactionDate
      ),

      merchant: data.merchant?.trim() || null,

      upiId: data.upiId?.trim().toLowerCase() || null,

      notes: data.notes?.trim() || null,

      category: data.category ?? ExpenseCategory.OTHER,
    },
  });
};

/**
 * Fetch a single transaction.
 */
export const getTransactionById = async (
  userId,
  transactionId
) => {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });
};

/**
 * Update a manual transaction.
 */
export const updateTransaction = async (
  userId,
  transactionId,
  data
) => {
  const transaction =
    await getTransactionById(
      userId,
      transactionId
    );

  if (!transaction) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (transaction.source !== TransactionSource.MANUAL) {
    throw new Error("EMAIL_TRANSACTION_READ_ONLY");
  }

  return prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data: {
      amount:
        data.amount !== undefined
          ? Number(data.amount)
          : undefined,

      debited:
        data.debited !== undefined
          ? data.debited
          : undefined,  

        merchant:
        data.merchant !== undefined
            ? data.merchant.trim()
            : undefined,

      upiId:
        data.upiId !== undefined
          ? data.upiId.trim().toLowerCase()
          : undefined,

        notes:
        data.notes !== undefined
            ? data.notes.trim()
            : undefined,

      category:
        data.category !== undefined
          ? data.category
          : undefined,

      transactionDate:
        data.transactionDate
          ? new Date(data.transactionDate)
          : undefined,
    },
  });
};

/**
 * Delete a manual transaction.
 */
export const deleteTransaction = async (
  userId,
  transactionId
) => {
  const transaction =
    await getTransactionById(
      userId,
      transactionId
    );

  if (!transaction) {
    throw new Error("TRANSACTION_NOT_FOUND");
  }

  if (transaction.source !== TransactionSource.MANUAL) {
    throw new Error("EMAIL_TRANSACTION_READ_ONLY");
  }

  await prisma.transaction.delete({
    where: {
      id: transactionId,
    },
  });
};