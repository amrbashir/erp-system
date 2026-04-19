import { resolve } from "node:path";
import { defineNitroConfig } from "nitro/config";

const isDesktop = process.env.DEPLOY_TARGET === "desktop";
const isProduction = process.env.NODE_ENV === "production";
const databaseAdapter = isDesktop
	? "adapters/pglite.ts"
	: isProduction
		? "adapters/neon.ts"
		: "adapters/postgres.ts";

const dir = import.meta.dirname;

export default defineNitroConfig({
	preset: isDesktop ? "deno-server" : undefined,
	serverDir: dir,
	plugins: isDesktop ? ["plugins/desktop-startup.ts"] : [],
	alias: {
		"~/": dir + "/",
		"#db": resolve(dir, databaseAdapter),
	},
	runtimeConfig: isDesktop ? { pgdataDir: "" } : {},
	serverAssets: isDesktop ? [{ baseName: "migrations", dir: resolve(dir, "../db/drizzle") }] : [],
	ignore: isDesktop ? [] : ["routes/desktop/**", "plugins/desktop-startup.ts"],
});
