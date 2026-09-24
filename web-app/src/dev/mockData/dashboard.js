import { MOCK_USER } from "./user";
import { MOCK_TRANSACTIONS } from "./transactions";

export const MOCK_DASHBOARD = {
  user: MOCK_USER,
  transactions: MOCK_TRANSACTIONS,
  summary: {
    totalIncome: MOCK_TRANSACTIONS.filter((tx) => !tx.debited).reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    totalSpending: MOCK_TRANSACTIONS.filter((tx) => tx.debited).reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    balance: 0,
    transactionCount: MOCK_TRANSACTIONS.length,
  },
};

export default MOCK_DASHBOARD;
