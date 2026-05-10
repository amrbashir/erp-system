import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { applyMigrations } from "@workspace/server/lib/migrate";
import { definePlugin } from "nitro";
import { useStorage } from "nitro/storage";

import { initDatabase } from "#db";

function ensureAuthSecret(dataDir: string) {
	if (process.env.BETTER_AUTH_SECRET) return;

	// Co-locate secret with pgdata so user-controlled storage survives upgrades.
	const baseDir = dirname(resolve(dataDir));
	const secretPath = resolve(baseDir, "auth-secret");

	if (existsSync(secretPath)) {
		process.env.BETTER_AUTH_SECRET = readFileSync(secretPath, "utf8").trim();
		return;
	}

	mkdirSync(baseDir, { recursive: true });
	const secret = randomBytes(48).toString("hex");
	writeFileSync(secretPath, secret, { mode: 0o600 });
	process.env.BETTER_AUTH_SECRET = secret;
}

export default definePlugin(async () => {
	const dataDir = process.env.NITRO_PGDATA_DIR;
	if (!dataDir) return;

	// must run before any auth.ts module evaluation triggered by route imports
	ensureAuthSecret(dataDir);

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
});
