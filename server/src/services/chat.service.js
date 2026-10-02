import { getTransactions } from "./transaction.service.js";
import * as parserService from "./parser.service.js";

export const chat = async (userId, query, context = null) => {
  const transactions = await getTransactions(userId);

  const budgets = [];

  return parserService.chat({
    query,
    ...(context ? { context } : {}),
    transactions,
    budgets,
  });
};