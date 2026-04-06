import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@workspace/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrations } from "../server/utils/migrate";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = resolve(__dirname, "../../../../packages/db/drizzle");

function readMigrationFile(path: string): Promise<string> {
	return readFile(resolve(migrationsDir, path), "utf-8");
}

describe("sidecar migrations", () => {
	let client: PGlite;
	let db: ReturnType<typeof drizzle<typeof schema>>;

	beforeAll(async () => {
		client = new PGlite();
		db = drizzle(client, { schema });
	});

	afterAll(async () => {
		await client.close();
	});

	it("should apply migrations and create all tables", async () => {
		await applyMigrations(db, readMigrationFile);

		const result = await db.execute<{ tablename: string }>(
			sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
		);
		const tables = result.rows.map((r) => r.tablename);
		expect(tables).toContain("users");
		expect(tables).toContain("orgs");
		expect(tables).toContain("sessions");
		expect(tables).toContain("accounts");
		expect(tables).toContain("org_members");
		expect(tables).toContain("activations");
		expect(tables).toContain("verifications");
	});

	it("should track applied migrations", async () => {
		const result = await db.execute<{ hash: string }>(
			sql`SELECT hash FROM "__drizzle_migrations"`,
		);
		expect(result.rows.length).toBeGreaterThan(0);
		expect(result.rows[0].hash).toBe("0000_robust_cable");
	});

	it("should be idempotent", async () => {
		await expect(applyMigrations(db, readMigrationFile)).resolves.not.toThrow();
	});

	it("should support insert after migration", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Sidecar Org", slug: "sidecar-org" })
			.returning();
		expect(org.id).toBeDefined();
		expect(org.defaultCurrency).toBe("USD");

		const [user] = await db
			.insert(schema.users)
			.values({ name: "Sidecar User" })
			.returning();
		expect(user.id).toBeDefined();
		expect(user.email).toBeNull();
	});
});
