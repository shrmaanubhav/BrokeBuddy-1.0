import axios from "axios";

import { isDevMode } from "../dev/mockMode";
import { MOCK_USER } from "../dev/mockData/user";
import { MOCK_TRANSACTIONS } from "../dev/mockData/transactions";

const baseURL =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_API_URL
    : "";

let mockTransactions = [...MOCK_TRANSACTIONS];

const makeResponse = (data, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config: {},
});

const resolveMockRequest = (config) => {
  if (!isDevMode()) {
    return null;
  }

  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const payload = config.data ? JSON.parse(config.data) : null;
  const params = config.params || {};

  if (url === "/api/auth/checkAuth") {
    return makeResponse({ ...MOCK_USER, authenticated: true });
  }

  if (url === "/api/auth/logout") {
    return makeResponse({ msg: "Logged out successfully." });
  }

  if (url === "/api/profile/me") {
    return makeResponse({ ...MOCK_USER });
  }

  if (url === "/api/profile/account" && method === "delete") {
    return makeResponse({ msg: "Account deleted successfully." });
  }

  if (url === "/api/user/bank-email") {
    if (method === "get") {
      return makeResponse({ bankSenderEmail: "test.bank@gmail.com", bankSenderVerified: true });
    }

    if (method === "put") {
      const nextEmail = payload?.bankSenderEmail || "test.bank@gmail.com";
      return makeResponse({ bankSenderEmail: nextEmail, bankSenderVerified: true });
    }
  }

  if (url === "/api/profile/sync-transactions") {
    return makeResponse({ total: 0, msg: "No new transactions found." });
  }

  if (url === "/api/nicknames") {
    if (method === "get") {
      return makeResponse({});
    }

    if (method === "post") {
      return makeResponse({ ok: true });
    }
  }

  if (url === "/api/transactions") {
    if (method === "get") {
      return makeResponse([...mockTransactions]);
    }

    if (method === "post") {
      const nextTransaction = {
        id: `mock-${Date.now()}`,
        merchant: payload?.merchant || "Manual Entry",
        amount: Number(payload?.amount || 0),
        debited: payload?.debited === true,
        transactionDate: payload?.transactionDate || new Date().toISOString(),
        upiId: payload?.upiId || null,
        category: payload?.category || "Misc",
        source: payload?.upiId ? "UPI" : "MANUAL",
        notes: payload?.notes || "Manual transaction",
      };
      mockTransactions = [nextTransaction, ...mockTransactions];
      return makeResponse(nextTransaction, 201);
    }
  }

  if (url.startsWith("/api/transactions/")) {
    const transactionId = url.split("/").filter(Boolean).at(-1);
    if (method === "delete") {
      mockTransactions = mockTransactions.filter((tx) => tx.id !== transactionId);
      return makeResponse({ msg: "Transaction deleted successfully." });
    }
  }

  if (url === "/api/transactions/search") {
    let filtered = [...mockTransactions];
    const startDate = params.startDate ? new Date(params.startDate) : null;
    const endDate = params.endDate ? new Date(params.endDate) : null;
    const query = (params.query || "").trim().toLowerCase();

    if (startDate) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.transactionDate);
        const afterStart = txDate >= startDate;
        const beforeEnd = !endDate || txDate <= endDate;
        return afterStart && beforeEnd;
      });
    }

    if (query) {
      filtered = filtered.filter((tx) => {
        const searchable = [
          tx.merchant,
          tx.upiId,
          tx.notes,
          tx.category,
          tx.source,
          tx.amount,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });
    }

    return makeResponse(filtered);
  }

  return null;
};

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const mockResponse = resolveMockRequest(config);
  if (mockResponse) {
    config.adapter = async () => mockResponse;
  }
  return config;
});

export default api;