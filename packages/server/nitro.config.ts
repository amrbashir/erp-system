import { resolve } from "node:path";

import { defineNitroConfig } from "nitro/config";

const isDesktop = process.env.DEPLOY_TARGET === "desktop";
const isProduction = process.env.NODE_ENV === "production";
const databaseAdapter = isDesktop
	? "@workspace/db/adapters/pglite"
	: isProduction
		? "@workspace/db/adapters/neon"
		: "@workspace/db/adapters/postgres";

const dir = import.meta.dirname;

export default defineNitroConfig({
	preset: isDesktop ? "deno-server" : undefined,
	serverDir: dir,
	plugins: [
		resolve(dir, "plugins/cors.ts"),
		...(isDesktop ? [resolve(dir, "plugins/desktop-startup.ts")] : []),
	],
	alias: {
		"#db": databaseAdapter,
	},
	runtimeConfig: isDesktop ? { pgdataDir: "" } : {},
	serverAssets: isDesktop ? [{ baseName: "migrations", dir: resolve(dir, "../db/drizzle") }] : [],
	ignore: isDesktop ? [] : ["plugins/desktop-startup.ts"],
});
