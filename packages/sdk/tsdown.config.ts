import { defineConfig } from "tsdown/config";

export default defineConfig({
  entry: ["src/index.ts", "src/generated/zod.gen.ts"],
  unbundle: true,
  dts: true,
});
