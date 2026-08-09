import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const env = {
  port: Number(process.env.PORT ?? 4100),
  mediaStorageDir: resolve(process.env.MEDIA_STORAGE_DIR ?? "./data/media"),
};

if (!existsSync(env.mediaStorageDir)) {
  mkdirSync(env.mediaStorageDir, { recursive: true });
}
