import { getTransactions } from "./transaction.service.js";
import * as parserService from "./parser.service.js";

export const chat = async (userId, query) => {
  const transactions = await getTransactions(userId);

  const budgets = [];

  return parserService.chat({
    query,
    transactions,
    budgets,
  });
};