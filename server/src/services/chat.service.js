import { getTransactions } from "./transaction.service.js";

const PYTHON_API_URL =
  process.env.PYTHON_API_URL || "http://localhost:5000";

export const chat = async (userId, query) => {
  // Fetch user's transactions
  const transactions = await getTransactions(userId);

  // TODO: Replace with actual budget service later
  const budgets = [];

  const response = await fetch(`${PYTHON_API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      transactions,
      budgets,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to communicate with AI service");
  }

  const data = await response.json();

  return data;
};