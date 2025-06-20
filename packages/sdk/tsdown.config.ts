import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: ["src/index.ts", "src/schema.zod.ts"],
  unbundle: true,
  dts: true,
});
