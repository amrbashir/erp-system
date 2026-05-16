import { sql } from "drizzle-orm";

import type { DB } from "../shared/db.js";

interface JournalEntry {
	idx: number;
	tag: string;
}

export interface Journal {
	entries: JournalEntry[];
}

/** `readSql(tag)` returns the SQL for a migration (Nitro server assets in prod, disk in tests). */
export async function applyMigrations(
	db: DB,
	journal: Journal,
	readSql: (tag: string) => Promise<string>,
) {
	await db.execute(sql`
		CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
			id SERIAL PRIMARY KEY,
			hash TEXT NOT NULL UNIQUE,
			created_at BIGINT
		)
	`);

	const applied = await db.execute<{ hash: string }>(
		sql`SELECT hash FROM "__drizzle_migrations"`,
	);
	const appliedSet = new Set(applied.rows.map((r: { hash: string }) => r.hash));

	for (const entry of journal.entries.sort((a, b) => a.idx - b.idx)) {
		if (appliedSet.has(entry.tag)) continue;

		const migrationSql = await readSql(entry.tag);
		const statements = migrationSql.split("--> statement-breakpoint");

		for (const stmt of statements) {
			const trimmed = stmt.trim();
			if (trimmed) {
				// sql.raw needed for DDL. Input trusted (committed migration files, no user input).
				await db.execute(sql.raw(trimmed));
			}
		}

		await db.execute(
			sql`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (${entry.tag}, ${Date.now()})`,
		);
	}
}
