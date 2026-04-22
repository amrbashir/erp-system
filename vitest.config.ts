import { resolve } from "node:path";

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "happy-dom",
		exclude: ["**/node_modules/**", "**/dist/**", ".ralph/**"],
	},
	resolve: {
		alias: {
			"#db": resolve(__dirname, "packages/db/src/adapters/pglite.ts"),
			"@electric-sql/pglite": resolve(
				__dirname,
				"packages/db/node_modules/@electric-sql/pglite/dist/index.js",
			),
		},
	},
});
