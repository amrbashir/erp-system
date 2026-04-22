import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { createOrg, getUserOrgs, getOrgMembership } from "./org.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

let userA: string;
let userB: string;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });

	// seed two users
	const [a] = await db
		.insert(schema.users)
		.values({ name: "Alice", email: "alice@test.com" })
		.returning();
	const [b] = await db
		.insert(schema.users)
		.values({ name: "Bob", email: "bob@test.com" })
		.returning();
	userA = a.id;
	userB = b.id;
});

afterAll(async () => {
	await client.close();
});

describe("createOrg", () => {
	it("creates org and makes creator the owner", async () => {
		const org = await createOrg(db as any, {
			name: "Acme Corp",
			slug: "acme-corp",
			userId: userA,
		});

		expect(org.name).toBe("Acme Corp");
		expect(org.slug).toBe("acme-corp");
		expect(org.defaultCurrency).toBe("USD");

		const membership = await getOrgMembership(db as any, userA, org.id);
		expect(membership).not.toBeNull();
		expect(membership!.role).toBe("owner");
	});

	it("rejects duplicate slug with 'Slug already taken'", async () => {
		await expect(
			createOrg(db as any, {
				name: "Acme Duplicate",
				slug: "acme-corp",
				userId: userA,
			}),
		).rejects.toThrow("Slug already taken");
	});

	it("rejects invalid slug format", async () => {
		await expect(
			createOrg(db as any, {
				name: "Bad Slug",
				slug: "-bad-slug-",
				userId: userA,
			}),
		).rejects.toThrow();
	});

	it("rejects invalid currency", async () => {
		await expect(
			createOrg(db as any, {
				name: "Bad Currency",
				slug: "bad-currency",
				userId: userA,
				currency: "XYZ",
			}),
		).rejects.toThrow("Unsupported currency");
	});

	it("accepts valid currency", async () => {
		const org = await createOrg(db as any, {
			name: "EUR Org",
			slug: "eur-org",
			userId: userA,
			currency: "EUR",
		});
		expect(org.defaultCurrency).toBe("EUR");
	});
});

describe("getUserOrgs", () => {
	it("returns orgs the user belongs to", async () => {
		const orgs = await getUserOrgs(db as any, userA);
		expect(orgs.length).toBeGreaterThanOrEqual(1);
		expect(orgs[0].name).toBe("Acme Corp");
		expect(orgs[0].role).toBe("owner");
	});

	it("returns empty for user with no orgs", async () => {
		const orgs = await getUserOrgs(db as any, userB);
		expect(orgs).toHaveLength(0);
	});
});

describe("org data isolation", () => {
	it("user in org A cannot see org B via getUserOrgs", async () => {
		const orgB = await createOrg(db as any, {
			name: "Bob Inc",
			slug: "bob-inc",
			userId: userB,
		});

		const aliceOrgs = await getUserOrgs(db as any, userA);
		const bobOrgs = await getUserOrgs(db as any, userB);

		expect(aliceOrgs.every((o) => o.id !== orgB.id)).toBe(true);
		expect(bobOrgs.some((o) => o.id === orgB.id)).toBe(true);
	});

	it("scoped query via set_config only returns matching org rows", async () => {
		const aliceOrgs = await getUserOrgs(db as any, userA);
		const aliceOrgId = aliceOrgs[0].id;

		// set session var used by RLS policies
		await db.execute(sql`SELECT set_config('app.current_org_id', ${aliceOrgId}, false)`);

		// simulate what an RLS policy does: filter by current_setting
		const rows = await db.execute(
			sql`SELECT * FROM org_members WHERE org_id = current_setting('app.current_org_id')::uuid`,
		);

		expect(rows.rows.length).toBeGreaterThanOrEqual(1);
		for (const row of rows.rows) {
			expect((row as any).org_id).toBe(aliceOrgId);
		}
	});
});
