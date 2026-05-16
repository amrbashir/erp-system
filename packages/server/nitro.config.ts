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
	alias: { "#db": databaseAdapter },
	serverAssets: isDesktop
		? [
				{
					baseName: "migrations",
					dir: resolve(dir, "../db/drizzle"),
					// we are importing the migration files in the server code, so we need to ignore them in the server assets to avoid them being bundled and causing issues with the dynamic imports
					ignore: ["meta/**"],
				},
			]
		: [],
});
