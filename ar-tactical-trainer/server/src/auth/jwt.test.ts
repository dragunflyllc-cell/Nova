import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, verifyAccessToken } from "./jwt.js";
import { env } from "../env.js";

describe("access tokens", () => {
  const claims = { operatorId: "op_1", orgId: "org_1", role: "trainer" as const };

  it("round-trips valid claims", () => {
    const token = signAccessToken(claims);
    const decoded = verifyAccessToken(token);
    expect(decoded).toMatchObject(claims);
  });

  it("rejects a garbage token", () => {
    expect(verifyAccessToken("not.a.jwt")).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const forged = jwt.sign(claims, "some-other-secret");
    expect(verifyAccessToken(forged)).toBeNull();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign(claims, env.accessTokenSecret, { expiresIn: -10 });
    expect(verifyAccessToken(expired)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signAccessToken(claims);
    const [header, payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ ...claims, role: "admin" })).toString(
      "base64url",
    );
    expect(verifyAccessToken(`${header}.${tamperedPayload}.${signature}`)).toBeNull();
  });
});
