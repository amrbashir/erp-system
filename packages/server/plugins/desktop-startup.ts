import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { definePlugin } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import { useStorage } from "nitro/storage";

import { initDatabase } from "#db";
import { InvalidInputError } from "~/lib/errors";
import { applyMigrations } from "~/lib/migrate";

/** Read existing BETTER_AUTH_SECRET file, or generate + persist a new one. */
function ensureAuthSecret(dataDir: string | undefined) {
	if (process.env.BETTER_AUTH_SECRET) return;

	// Refuse to fall back to CWD: it's launch-dir dependent → secret rotates on
	// every relocation and invalidates every session. Tauri always sets
	// NITRO_PGDATA_DIR; if it's missing the host is misconfigured.
	if (!dataDir) {
		throw new Error(
			"[desktop-startup] pgdataDir is not configured; set NITRO_PGDATA_DIR " +
				"(via the Tauri host) or BETTER_AUTH_SECRET directly.",
		);
	}

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
	const config = useRuntimeConfig();
	const dataDir = (config as any).pgdataDir || undefined;

	// must run before any auth.ts module evaluation triggered by route imports
	ensureAuthSecret(dataDir);

	const db = await initDatabase(dataDir);

	const storage = useStorage("assets:migrations");
	await applyMigrations(db, async (path) => {
		const key = path.replace(/[\\/]/g, ":");
		const item = await storage.getItem(key);
		if (item === null || item === undefined) {
			throw new InvalidInputError({ reason: `Migration file not found: ${path}` });
		}
		return typeof item === "object" ? JSON.stringify(item) : String(item);
	});

	console.log("[desktop] database ready");
});
