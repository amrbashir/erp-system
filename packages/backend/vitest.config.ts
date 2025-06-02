import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [swc.vite()],
  test: {
    env: loadEnv(mode, process.cwd(), ""),
    includeSource: ["src/**/*.ts"],
  },
}));
