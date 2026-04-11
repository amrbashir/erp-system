import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	preset: "deno-server",
	serverDir: ".",
	plugins: ["plugins/desktop-startup.ts"],
	alias: {
		"@/": "./",
		"#db": "./adapters/pglite.ts",
		"#auth": "./lib/desktop-auth.ts",
	},
	runtimeConfig: {
		pgdataDir: "", // override via NITRO_PGDATA_DIR env var
	},
	serverAssets: [
		{
			baseName: "migrations",
			dir: "../db/drizzle",
		},
	],
});
