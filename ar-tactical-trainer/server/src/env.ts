import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const env = {
  port: Number(process.env.PORT ?? 4100),
  mediaStorageDir: resolve(process.env.MEDIA_STORAGE_DIR ?? "./data/media"),
  // Dev-only fallback so `pnpm dev` works with zero setup; a real
  // deployment must set a real secret, not this.
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "dev-insecure-secret-change-me",
  consoleOrigin: process.env.CONSOLE_ORIGIN ?? "http://localhost:3100",
};

if (process.env.NODE_ENV === "production" && !process.env.ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET must be set in production");
}

if (!existsSync(env.mediaStorageDir)) {
  mkdirSync(env.mediaStorageDir, { recursive: true });
}
