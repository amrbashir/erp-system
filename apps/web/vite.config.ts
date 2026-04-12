import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const serverPkg = resolve(__dirname, "../../packages/server");

// Tauri sets TAURI_ENV_PLATFORM during dev/build; use it to detect desktop context
if (!process.env.VITE_PLATFORM) {
	process.env.VITE_PLATFORM = process.env.TAURI_ENV_PLATFORM ? "desktop" : "web";
}

const dbAlias = fileURLToPath(new URL("../../packages/server/adapters/neon.ts", import.meta.url));

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "../../packages/i18n/project.inlang",
			outdir: "../../packages/i18n/src/paraglide",
			strategy: ["localStorage", "preferredLanguage", "baseLocale"],
		}) as any,
		nitro({
			scanDirs: [serverPkg],
			ignore: ["routes/desktop/**"],
			alias: {
				"#db": dbAlias,
				"#auth": resolve(__dirname, "src/lib/auth.ts"),
			},
		}),
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
	resolve: {
		alias: { "#db": dbAlias },
	},
});
