import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = { __BROKEBUDDY_DEV_MODE__: true };

test("dev mode returns mock user and transactions through the shared api client", async () => {
  const api = (await import("../lib/api.js")).default;

  const user = await api.get("/api/profile/me");
  assert.equal(user.data.name, "Test User");

  const transactions = await api.get("/api/transactions");
  assert.ok(Array.isArray(transactions.data));
  assert.ok(transactions.data.length > 0);
});
