import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const env = {
  port: Number(process.env.PORT ?? 4100),
  mediaStorageDir: resolve(process.env.MEDIA_STORAGE_DIR ?? "./data/media"),
  // Dev-only fallback so `pnpm dev` works with zero setup; a real
  // deployment must set a real secret, not this.
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "dev-insecure-secret-change-me",
  consoleOrigin: process.env.CONSOLE_ORIGIN ?? "http://localhost:3100",
  // Off by default: every request is treated as a fixed default org/admin,
  // no login needed. Flip to "false" once you're ready to onboard real
  // agencies with real accounts — see docs/ARCHITECTURE.md's Auth section.
  authDisabled: process.env.DISABLE_AUTH !== "false",
};

if (process.env.NODE_ENV === "production" && !process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET must be set in production");
}

if (process.env.NODE_ENV === "production" && env.authDisabled) {
  throw new Error("DISABLE_AUTH must be \"false\" in production — dev mode has no login at all");
}

if (!existsSync(env.mediaStorageDir)) {
  mkdirSync(env.mediaStorageDir, { recursive: true });
}
