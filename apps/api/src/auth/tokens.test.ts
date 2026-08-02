import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { signStateToken, verifyStateToken } from "./tokens.js";

test("state token round-trips the userId for the same purpose", async () => {
  const token = await signStateToken("user-123", "tradovate-oauth");
  const userId = await verifyStateToken(token, "tradovate-oauth");
  assert.equal(userId, "user-123");
});

test("state token is rejected when verified against a different purpose", async () => {
  const token = await signStateToken("user-123", "tradovate-oauth");
  await assert.rejects(() => verifyStateToken(token, "some-other-flow"));
});

test("garbage state token is rejected", async () => {
  await assert.rejects(() => verifyStateToken("not-a-real-token", "tradovate-oauth"));
});
