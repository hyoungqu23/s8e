import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@s8e/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@s8e/i18n": resolve(__dirname, "../../packages/i18n/src/index.ts"),
      "@s8e/ledger-kit": resolve(__dirname, "../../packages/ledger-kit/src/index.ts"),
      "@s8e/csv-kit": resolve(__dirname, "../../packages/csv-kit/src/index.ts")
    }
  },
  test: {
    environment: "node"
  }
});
