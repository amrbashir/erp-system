import { defineConfig } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		viteTsConfigPaths({
			projects: ["./apps/web/tsconfig.json"],
		}),
	],
	test: {
		environment: "jsdom",
	},
});
