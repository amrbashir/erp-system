import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    includeSource: ["src/**/*.ts"],
  },
}));
