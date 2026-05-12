import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

import nitroConfig from "../../packages/server/nitro.config.ts";

const isDesktop = process.env.DEPLOY_TARGET === "desktop";

export default defineConfig({
	server: { port: 1520, strictPort: true },
	envPrefix: ["DEPLOY_TARGET", "ACTIVATION_API_URL", "ACTIVATION_PUBLIC_KEY"],
	// Workaround for nitro upstream bug (no tracking issue yet): createServiceEnvironment doesn't set noExternal for the node runner in dev, so Vite externalizes `nitro/*` before nitroServiceProxy.resolveId can intercept. SSR env then native-imports the stub `#nitro/virtual/plugins` and gets its own empty NitroApp (no init plugin, no db).
	ssr: { noExternal: ["nitro"] },
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
