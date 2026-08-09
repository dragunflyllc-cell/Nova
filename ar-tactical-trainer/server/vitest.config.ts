import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests share one SQLite file (server/prisma/test.db);
    // running files in parallel would hit "database is locked" errors.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 15_000,
    // src/auth/dev-mode.manual-test.ts deliberately doesn't match this
    // default include glob — it needs DISABLE_AUTH left at its default
    // (on) and its own DB, unlike every other test file here (which force
    // DISABLE_AUTH=false to test real auth). Run it via
    // `pnpm test:devmode`, which points vitest at vitest.devmode.config.ts.
  },
});
