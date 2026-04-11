import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		environment: "happy-dom",
		exclude: ["**/node_modules/**", "**/dist/**", ".ralph/**"],
	},
	resolve: {
		alias: {
			"#db": path.resolve(__dirname, "packages/server/adapters/pglite.ts"),
		},
	},
});
