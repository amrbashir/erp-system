import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { InvalidSlugError, SlugTakenError, UnsupportedCurrencyError } from "../shared/errors.js";

import { OrgsService } from "./orgs.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let svc: OrgsService;

let userA: string;
let userB: string;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });
	svc = new OrgsService({ db: db as any });

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

describe("OrgsService.create", () => {
	it("creates org and makes creator the owner", async () => {
		const org = await svc.create({
			name: "Acme Corp",
			slug: "acme-corp",
			userId: userA,
		});
		if (org instanceof Error) throw org;

		expect(org.name).toBe("Acme Corp");
		expect(org.slug).toBe("acme-corp");
		expect(org.defaultCurrency).toBe("USD");

		const membership = await svc.getMembership(userA, org.id);
		expect(membership).not.toBeNull();
		expect(membership!.role).toBe("owner");
	});

	it("returns SlugTakenError on duplicate slug", async () => {
		const result = await svc.create({
			name: "Acme Duplicate",
			slug: "acme-corp",
			userId: userA,
		});
		expect(result).toBeInstanceOf(SlugTakenError);
	});

	it("returns InvalidSlugError on bad slug format", async () => {
		const result = await svc.create({
			name: "Bad Slug",
			slug: "-bad-slug-",
			userId: userA,
		});
		expect(result).toBeInstanceOf(InvalidSlugError);
	});

	it("returns UnsupportedCurrencyError on bad currency", async () => {
		const result = await svc.create({
			name: "Bad Currency",
			slug: "bad-currency",
			userId: userA,
			currency: "XYZ",
		});
		expect(result).toBeInstanceOf(UnsupportedCurrencyError);
	});

	it("accepts valid currency", async () => {
		const org = await svc.create({
			name: "EUR Org",
			slug: "eur-org",
			userId: userA,
			currency: "EUR",
		});
		if (org instanceof Error) throw org;
		expect(org.defaultCurrency).toBe("EUR");
	});
});

describe("OrgsService.listByUser", () => {
	it("returns orgs the user belongs to", async () => {
		const orgs = await svc.listByUser(userA);
		expect(orgs.length).toBeGreaterThanOrEqual(1);
		expect(orgs[0].name).toBe("Acme Corp");
		expect(orgs[0].role).toBe("owner");
	});

	it("returns empty for user with no orgs", async () => {
		const orgs = await svc.listByUser(userB);
		expect(orgs).toHaveLength(0);
	});
});

describe("org data isolation", () => {
	it("user in org A cannot see org B via listByUser", async () => {
		const orgB = await svc.create({
			name: "Bob Inc",
			slug: "bob-inc",
			userId: userB,
		});
		if (orgB instanceof Error) throw orgB;

		const aliceOrgs = await svc.listByUser(userA);
		const bobOrgs = await svc.listByUser(userB);

		expect(aliceOrgs.every((o) => o.id !== orgB.id)).toBe(true);
		expect(bobOrgs.some((o) => o.id === orgB.id)).toBe(true);
	});

	it("scoped query via set_config only returns matching org rows", async () => {
		const aliceOrgs = await svc.listByUser(userA);
		const aliceOrgId = aliceOrgs[0].id;

		await db.execute(sql`SELECT set_config('app.current_org_id', ${aliceOrgId}, false)`);

		const rows = await db.execute(
			sql`SELECT * FROM org_members WHERE org_id = current_setting('app.current_org_id')::uuid`,
		);

		expect(rows.rows.length).toBeGreaterThanOrEqual(1);
		for (const row of rows.rows) {
			expect((row as any).org_id).toBe(aliceOrgId);
		}
	});
});
