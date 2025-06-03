import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: "src/main.ts",
  unbundle: true,
  define: {
    "import.meta.vitest": "undefined",
  },
});
