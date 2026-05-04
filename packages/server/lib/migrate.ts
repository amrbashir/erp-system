import { sql } from "drizzle-orm";

import type { DB } from "../shared/db.js";

interface JournalEntry {
	idx: number;
	tag: string;
}

interface Journal {
	entries: JournalEntry[];
}

/**
 * Apply Drizzle migrations using a `readFile` callback.
 * In tests, `readFile` reads from disk; in production, from Nitro's server assets.
 */
export async function applyMigrations(
	db: DB,
	readFile: (path: string) => Promise<string>,
) {
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
			id SERIAL PRIMARY KEY,
			hash TEXT NOT NULL UNIQUE,
			created_at BIGINT
		)
	`);

	const journalStr = await readFile("meta/_journal.json");
	const journal: Journal = JSON.parse(journalStr);

	const applied = await db.execute<{ hash: string }>(
		sql`SELECT hash FROM "__drizzle_migrations"`,
	);
	const appliedSet = new Set(applied.rows.map((r: { hash: string }) => r.hash));

	for (const entry of journal.entries.sort((a, b) => a.idx - b.idx)) {
		if (appliedSet.has(entry.tag)) continue;

		const migrationSql = await readFile(`${entry.tag}.sql`);
		const statements = migrationSql.split("--> statement-breakpoint");

		for (const stmt of statements) {
			const trimmed = stmt.trim();
			if (trimmed) {
				await db.execute(sql.raw(trimmed));
			}
		}

		await db.execute(
			sql`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (${entry.tag}, ${Date.now()})`,
		);
	}
}
