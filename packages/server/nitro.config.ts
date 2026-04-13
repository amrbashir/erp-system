import { resolve } from "node:path";
import { defineNitroConfig } from "nitro/config";

const isDesktop = process.env.DEPLOY_TARGET === "desktop";
const dir = import.meta.dirname;

export default defineNitroConfig({
	preset: isDesktop ? "deno-server" : undefined,
	serverDir: dir,
	plugins: isDesktop ? ["plugins/desktop-startup.ts"] : [],
	alias: {
		"@/": dir + "/",
		"#db": resolve(dir, isDesktop ? "adapters/pglite.ts" : "adapters/neon.ts"),
	},
	runtimeConfig: isDesktop ? { pgdataDir: "" } : {},
	serverAssets: isDesktop
		? [{ baseName: "migrations", dir: resolve(dir, "../db/drizzle") }]
		: [],
	ignore: isDesktop ? [] : ["routes/desktop/**"],
});
