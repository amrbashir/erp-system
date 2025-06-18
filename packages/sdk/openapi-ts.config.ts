import { defineConfig } from "@hey-api/openapi-ts";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  input: resolve(__dirname, "../backend/dist/openapi.json"),
  output: resolve(__dirname, "src/generated"),
  plugins: [
    { name: "zod", exportFromIndex: true },
    {
      name: "@hey-api/sdk",
      methodNameBuilder: (o) => o.path.slice(1).replaceAll("/", "_"),
      instance: true,
      responseStyle: "data",
    },
  ],
});
