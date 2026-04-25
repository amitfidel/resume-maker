import { defineConfig } from "vitest/config";
import path from "node:path";

// Vitest is wired up only for pure-unit tests (no DB, no Next runtime).
// Integration / route tests that touch Drizzle or Server Components stay
// out of scope here — they belong in a Playwright-style suite, not unit.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
