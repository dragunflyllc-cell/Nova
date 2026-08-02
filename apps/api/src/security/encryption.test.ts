import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { decrypt, encrypt } from "./encryption.js";

test("encrypt/decrypt round-trips arbitrary text", () => {
  const plaintext = "a-fake-tradovate-access-token-value";
  const ciphertext = encrypt(plaintext);
  assert.notEqual(ciphertext, plaintext);
  assert.equal(decrypt(ciphertext), plaintext);
});

test("encrypt is non-deterministic (random IV per call)", () => {
  const a = encrypt("same input");
  const b = encrypt("same input");
  assert.notEqual(a, b);
});

test("decrypt rejects a tampered payload", () => {
  const ciphertext = encrypt("secret");
  const [iv, tag, data] = ciphertext.split(":");
  const tampered = [iv, tag, data!.slice(0, -2) + "00"].join(":");
  assert.throws(() => decrypt(tampered));
});
