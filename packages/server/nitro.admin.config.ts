import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
	preset: "node-server",
	serverDir: ".",
	ignore: ["routes/api/**", "routes/desktop/**"],
	alias: {
		"@/": "./",
		"#db": "./adapters/neon.ts",
		"#auth": "./lib/admin-auth.ts",
	},
	publicAssets: [
		{
			dir: "../../apps/admin/dist",
			baseURL: "/",
			fallthrough: true,
		},
	],
});
