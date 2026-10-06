import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for logic that needs no database or browser (the end-to-end
// suites in e2e/ cover the rest).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
