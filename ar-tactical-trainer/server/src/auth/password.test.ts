import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("verifies the correct password against its own hash", () => {
    const hash = hashPassword("correcthorsebattery");
    expect(verifyPassword("correcthorsebattery", hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("correcthorsebattery");
    expect(verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", () => {
    const a = hashPassword("correcthorsebattery");
    const b = hashPassword("correcthorsebattery");
    expect(a).not.toBe(b);
    expect(verifyPassword("correcthorsebattery", a)).toBe(true);
    expect(verifyPassword("correcthorsebattery", b)).toBe(true);
  });

  it("rejects malformed stored hashes instead of throwing", () => {
    expect(verifyPassword("anything", "not-a-valid-hash")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});
