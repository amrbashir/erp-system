import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const isProduction = process.env.NODE_ENV === "production";
const serverDir = resolve(import.meta.dirname, "../../packages/server");
const databaseAdapter = isProduction ? "adapters/neon.ts" : "adapters/postgres.ts";

export default defineConfig({
	plugins: [
		viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	resolve: {
		alias: {
			"#db": resolve(serverDir, databaseAdapter),
		},
	},
});
