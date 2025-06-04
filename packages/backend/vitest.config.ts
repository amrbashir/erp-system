import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import swc from "unplugin-swc";

export default defineConfig(({ mode }) => ({
  plugins: [swc.vite()],
  test: {
    env: loadEnv(mode, process.cwd(), ""),
    includeSource: ["src/**/*.ts"],
  },
}));
