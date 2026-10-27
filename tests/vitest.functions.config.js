import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/functions/**/*.test.js"],
    testTimeout: 30000,
    fileParallelism: false,
  },
});
