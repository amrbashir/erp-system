import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applyMigrations } from "./migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../db/drizzle");

function readMigrationFile(p: string): Promise<string> {
	return readFile(path.resolve(migrationsDir, p), "utf-8");
}

describe("applyMigrations", () => {
	let client: PGlite;
	let db: ReturnType<typeof drizzle<typeof schema>>;

	beforeAll(async () => {
		client = new PGlite();
		db = drizzle(client, { schema });
	});

	afterAll(async () => {
		await client.close();
	});

	it("creates all schema tables", async () => {
		await applyMigrations(db, readMigrationFile);

		const result = await db.execute<{ tablename: string }>(
			sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
		);
		const tables = result.rows.map((r) => r.tablename);
		expect(tables).toContain("users");
		expect(tables).toContain("orgs");
		expect(tables).toContain("sessions");
		expect(tables).toContain("org_members");
		expect(tables).toContain("activations");
	});

	it("tracks applied migrations", async () => {
		const result = await db.execute<{ hash: string }>(
			sql`SELECT hash FROM "__drizzle_migrations"`,
		);
		expect(result.rows.length).toBeGreaterThan(0);
		expect(result.rows[0].hash).toBe("0000_robust_cable");
	});

	it("is idempotent", async () => {
		await expect(applyMigrations(db, readMigrationFile)).resolves.not.toThrow();
	});

	it("allows inserts after migration", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Test Org", slug: "test-org" })
			.returning();
		expect(org.id).toBeDefined();
		expect(org.defaultCurrency).toBe("USD");
	});
});
