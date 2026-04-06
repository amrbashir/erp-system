import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	preset: "deno-server",
	runtimeConfig: {
		pgdataDir: "", // override via NITRO_PGDATA_DIR env var
	},
	serverAssets: [
		{
			baseName: "migrations",
			dir: "../../../packages/db/drizzle",
		},
	],
});
