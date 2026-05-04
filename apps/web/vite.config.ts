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
	plugins: [
		paraglideVitePlugin({
			project: "../../packages/i18n/project.inlang",
			outdir: "../../packages/i18n/src/paraglide",
			strategy: ["localStorage", "preferredLanguage", "baseLocale"],
			emitTsDeclarations: true,
		}),
		// nitroConfig comes from packages/server's nitro install; structurally
		// identical to this app's nitro install but TS treats them as separate
		// identities when the catalog's `nitro: latest` resolves to different
		// betas. Cast to the local plugin's expected param type — not `any`.
		nitro(nitroConfig as Parameters<typeof nitro>[0]),
		viteTsConfigPaths(),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	resolve: {
		alias: { "#db": nitroConfig.alias?.["#db"] ?? "" },
	},
});
