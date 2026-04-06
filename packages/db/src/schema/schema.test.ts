import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import * as schema from "./index.ts";
import { applyRls } from "../migrate.ts";

let client: PGlite;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle({ client, schema });
	await migrate(db, { migrationsFolder: "./packages/db/drizzle" });
	await applyRls(db);
});

afterAll(async () => {
	await client.close();
});

describe("tables exist", () => {
	const tables = [
		"orgs",
		"users",
		"sessions",
		"accounts",
		"verifications",
		"org_members",
		"activations",
	];

	for (const table of tables) {
		test(`${table} table exists`, async () => {
			const result = await db.execute(
				sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = ${table})`,
			);
			expect(result.rows[0].exists).toBe(true);
		});
	}
});

describe("columns and constraints", () => {
	test("orgs has default_currency", async () => {
		const org = await db
			.insert(schema.orgs)
			.values({ name: "Test Org" })
			.returning();
		expect(org[0].defaultCurrency).toBe("USD");
		expect(org[0].id).toBeTruthy();
		expect(org[0].createdAt).toBeInstanceOf(Date);
		expect(org[0].updatedAt).toBeInstanceOf(Date);
	});

	test("users has org_id FK and composite unique on org_id+username", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Unique Test Org" })
			.returning();

		await db
			.insert(schema.users)
			.values({ name: "User A", username: "alice", orgId: org.id });

		// duplicate org_id + username should fail
		await expect(
			db
				.insert(schema.users)
				.values({ name: "User B", username: "alice", orgId: org.id }),
		).rejects.toThrow();
	});

	test("org_members has role enum and composite unique on org_id+user_id", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Role Test Org" })
			.returning();
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Owner", orgId: org.id })
			.returning();

		const [member] = await db
			.insert(schema.orgMembers)
			.values({ orgId: org.id, userId: user.id, role: "owner" })
			.returning();
		expect(member.role).toBe("owner");

		// duplicate org_id + user_id should fail
		await expect(
			db
				.insert(schema.orgMembers)
				.values({ orgId: org.id, userId: user.id, role: "member" }),
		).rejects.toThrow();
	});

	test("activations has unique hardware_id", async () => {
		await db
			.insert(schema.activations)
			.values({ hardwareId: "hw-abc-123" });

		await expect(
			db.insert(schema.activations).values({ hardwareId: "hw-abc-123" }),
		).rejects.toThrow();
	});

	test("sessions has unique token", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Session Org" })
			.returning();
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Session User", orgId: org.id })
			.returning();

		await db.insert(schema.sessions).values({
			token: "unique-token-1",
			expiresAt: new Date("2030-01-01"),
			userId: user.id,
		});

		await expect(
			db.insert(schema.sessions).values({
				token: "unique-token-1",
				expiresAt: new Date("2030-01-01"),
				userId: user.id,
			}),
		).rejects.toThrow();
	});
});

describe("RLS policies", () => {
	const rlsTables = ["users", "sessions", "accounts", "org_members"];

	for (const table of rlsTables) {
		test(`${table} has RLS enabled`, async () => {
			const result = await db.execute(
				sql`SELECT relrowsecurity FROM pg_class WHERE relname = ${table}`,
			);
			expect(result.rows[0].relrowsecurity).toBe(true);
		});

		test(`${table} has org_isolation policy`, async () => {
			const result = await db.execute(
				sql`SELECT policyname FROM pg_policies WHERE tablename = ${table} AND policyname = ${"org_isolation_" + table}`,
			);
			expect(result.rows.length).toBe(1);
		});
	}
});
