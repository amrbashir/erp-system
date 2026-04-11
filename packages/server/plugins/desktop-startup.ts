import { definePlugin } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import { useStorage } from "nitro/storage";

import { initDatabase } from "#db";

import { applyMigrations } from "@/lib/migrate";

export default definePlugin(async () => {
	const config = useRuntimeConfig();
	const dataDir = (config as any).pgdataDir || undefined;
	const db = await initDatabase(dataDir);

	const storage = useStorage("assets:migrations");
	await applyMigrations(db, async (path) => {
		const key = path.replace(/[\\/]/g, ":");
		const item = await storage.getItem(key);
		if (item === null || item === undefined) {
			throw new Error(`Migration file not found: ${path}`);
		}
		return typeof item === "object" ? JSON.stringify(item) : String(item);
	});

	console.log("[desktop] database ready");
});
