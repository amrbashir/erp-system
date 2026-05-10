import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import nitroConfig from "../../packages/server/nitro.config.ts";

// Tauri sets TAURI_ENV_PLATFORM during dev/build; use it to detect desktop context.
// nitroConfig was imported above with DEPLOY_TARGET unset — keeps embedded nitro
// in postgres mode for tauri dev. Production desktop uses a separate sidecar.
if (!process.env.DEPLOY_TARGET) {
	process.env.DEPLOY_TARGET = process.env.TAURI_ENV_PLATFORM ? "desktop" : "web";
}

const isDesktop = process.env.DEPLOY_TARGET === "desktop";

export default defineConfig({
	server: { port: 1520 },
	envPrefix: ["DEPLOY_TARGET", "ACTIVATION_API_URL", "ACTIVATION_PUBLIC_KEY"],
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
		tanstackStart(isDesktop ? { spa: { enabled: true } } : undefined),
		viteReact(),
	],
	resolve: {
		alias: { "#db": nitroConfig.alias?.["#db"] ?? "" },
	},
});
