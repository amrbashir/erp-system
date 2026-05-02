import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { rlsStatements } from "../rls/index.js";
import * as schema from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });
});

afterAll(async () => {
	await client.close();
});

describe("migrations", () => {
	it("should create all tables", async () => {
		const result = await db.execute<{ tablename: string }>(
			sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
		);
		const tables = result.rows.map((r) => r.tablename);
		expect(tables).toContain("orgs");
		expect(tables).toContain("users");
		expect(tables).toContain("sessions");
		expect(tables).toContain("accounts");
		expect(tables).toContain("verifications");
		expect(tables).toContain("org_members");
		expect(tables).toContain("invitations");
		expect(tables).toContain("activations");
	});

	it("should create enums", async () => {
		const result = await db.execute<{ typname: string }>(
			sql`SELECT typname FROM pg_type WHERE typname IN ('member_role', 'activation_status') ORDER BY typname`,
		);
		const enums = result.rows.map((r) => r.typname);
		expect(enums).toContain("member_role");
		expect(enums).toContain("activation_status");
	});
});

describe("orgs table", () => {
	it("should insert and retrieve an org with default_currency", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Test Org", slug: "test-org" })
			.returning();
		expect(org.id).toBeDefined();
		expect(org.defaultCurrency).toBe("USD");
		expect(org.createdAt).toBeInstanceOf(Date);
		expect(org.updatedAt).toBeInstanceOf(Date);
	});

	it("should enforce unique slug", async () => {
		await db.insert(schema.orgs).values({ name: "Org A", slug: "unique-slug" });
		await expect(
			db.insert(schema.orgs).values({ name: "Org B", slug: "unique-slug" }),
		).rejects.toThrow();
	});
});

describe("users table", () => {
	it("should insert user with UUID pk and timestamps", async () => {
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Alice", email: "alice@test.com" })
			.returning();
		expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
		expect(user.createdAt).toBeInstanceOf(Date);
		expect(user.updatedAt).toBeInstanceOf(Date);
	});

	it("should require email", async () => {
		await expect(db.insert(schema.users).values({ name: "No Email" } as any)).rejects.toThrow();
	});

	it("should enforce case-insensitive unique email", async () => {
		await db.insert(schema.users).values({ name: "Lower", email: "case@test.com" });
		await expect(
			db.insert(schema.users).values({ name: "Upper", email: "CASE@test.com" }),
		).rejects.toThrow();
	});
});

describe("org_members table", () => {
	it("should enforce org_id + user_id uniqueness", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Member Org", slug: "member-org" })
			.returning();
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Bob", email: "bob@test.com" })
			.returning();

		await db
			.insert(schema.orgMembers)
			.values({ orgId: org.id, userId: user.id, role: "owner" });

		await expect(
			db.insert(schema.orgMembers).values({ orgId: org.id, userId: user.id, role: "member" }),
		).rejects.toThrow();
	});

	it("should default role to member", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Role Org", slug: "role-org" })
			.returning();
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Charlie", email: "charlie@test.com" })
			.returning();

		const [member] = await db
			.insert(schema.orgMembers)
			.values({ orgId: org.id, userId: user.id })
			.returning();
		expect(member.role).toBe("member");
	});
});

describe("invitations table", () => {
	it("should insert with default role member and timestamp", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Inv Org", slug: "inv-org-1" })
			.returning();
		const [inv] = await db
			.insert(schema.invitations)
			.values({ orgId: org.id, email: "invitee@test.com" })
			.returning();
		expect(inv.id).toBeDefined();
		expect(inv.role).toBe("member");
		expect(inv.invitedBy).toBeNull();
		expect(inv.createdAt).toBeInstanceOf(Date);
	});

	it("should enforce case-insensitive unique (org_id, email)", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Inv Unique", slug: "inv-org-2" })
			.returning();
		await db
			.insert(schema.invitations)
			.values({ orgId: org.id, email: "Dup@Test.com", role: "member" });
		await expect(
			db
				.insert(schema.invitations)
				.values({ orgId: org.id, email: "dup@test.com", role: "admin" }),
		).rejects.toThrow();
	});

	it("should allow same email across different orgs", async () => {
		const [orgA] = await db
			.insert(schema.orgs)
			.values({ name: "A", slug: "inv-org-3a" })
			.returning();
		const [orgB] = await db
			.insert(schema.orgs)
			.values({ name: "B", slug: "inv-org-3b" })
			.returning();
		await db.insert(schema.invitations).values({ orgId: orgA.id, email: "shared@test.com" });
		const [inv] = await db
			.insert(schema.invitations)
			.values({ orgId: orgB.id, email: "shared@test.com" })
			.returning();
		expect(inv.orgId).toBe(orgB.id);
	});

	it("should cascade-delete invitations when org is deleted", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Doomed", slug: "inv-org-4" })
			.returning();
		await db.insert(schema.invitations).values({ orgId: org.id, email: "x@test.com" });
		await db.delete(schema.orgs).where(sql`id = ${org.id}`);
		const remaining = await db
			.select()
			.from(schema.invitations)
			.where(sql`org_id = ${org.id}`);
		expect(remaining).toHaveLength(0);
	});

	it("should null invitedBy when inviter user is deleted", async () => {
		const [org] = await db
			.insert(schema.orgs)
			.values({ name: "Inviter Org", slug: "inv-org-5" })
			.returning();
		const [inviter] = await db
			.insert(schema.users)
			.values({ name: "Inviter", email: "inviter@test.com" })
			.returning();
		const [inv] = await db
			.insert(schema.invitations)
			.values({ orgId: org.id, email: "y@test.com", invitedBy: inviter.id })
			.returning();
		expect(inv.invitedBy).toBe(inviter.id);

		await db.delete(schema.users).where(sql`id = ${inviter.id}`);
		const [reloaded] = await db
			.select()
			.from(schema.invitations)
			.where(sql`id = ${inv.id}`);
		expect(reloaded.invitedBy).toBeNull();
	});
});

describe("activations table", () => {
	it("should insert with default pending status", async () => {
		const [activation] = await db
			.insert(schema.activations)
			.values({ hardwareId: "sha256-abc123" })
			.returning();
		expect(activation.status).toBe("pending");
		expect(activation.activatedAt).toBeNull();
	});

	it("should enforce unique hardware_id", async () => {
		await db.insert(schema.activations).values({ hardwareId: "sha256-unique" });
		await expect(
			db.insert(schema.activations).values({ hardwareId: "sha256-unique" }),
		).rejects.toThrow();
	});
});

describe("RLS policies", () => {
	it("should enable RLS on org_members", async () => {
		for (const stmt of rlsStatements) {
			await db.execute(stmt);
		}

		const result = await db.execute<{ relname: string; relrowsecurity: boolean }>(
			sql`SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'org_members'`,
		);
		expect(result.rows[0].relrowsecurity).toBe(true);
	});
});
