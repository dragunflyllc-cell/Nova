import { defineConfig } from "vitest/config";

// Separate config, only for `pnpm test:devmode`. src/auth/dev-mode.manual-test.ts
// is named so it never matches vitest.config.ts's default include glob
// (it needs DISABLE_AUTH left at its default instead of the main suite's
// forced DISABLE_AUTH=false, and its own DB) — this file's `include` is
// the only thing that ever discovers it.
export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 15_000,
    hookTimeout: 15_000,
    include: ["src/auth/dev-mode.manual-test.ts"],
  },
});
