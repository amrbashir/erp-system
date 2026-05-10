import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import nitroConfig from "../../packages/server/nitro.config.ts";

// Tauri sets TAURI_ENV_PLATFORM during dev/build; use it to detect desktop context
if (!process.env.VITE_PLATFORM) {
	process.env.VITE_PLATFORM = process.env.TAURI_ENV_PLATFORM ? "desktop" : "web";
}

export default defineConfig({
	server: { port: 1520 },
	plugins: [
		paraglideVitePlugin({
			project: "../../packages/i18n/project.inlang",
			outdir: "../../packages/i18n/src/paraglide",
			strategy: ["localStorage", "preferredLanguage", "baseLocale"],
			emitTsDeclarations: true,
		}),
		nitro(nitroConfig),
		viteTsConfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	resolve: {
		alias: { "#db": nitroConfig.alias?.["#db"] ?? "" },
	},
});
