import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { OrgsService } from "../orgs/orgs.service.js";
import { DuplicateMemberError } from "../shared/errors.js";

import { InvitationsService } from "./invitations.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let svc: InvitationsService;
let orgsSvc: OrgsService;
let owner: string;
let orgId: string;

function unwrap<T>(v: T): Exclude<T, Error> {
	if (v instanceof Error) throw v;
	return v as Exclude<T, Error>;
}

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });
	svc = new InvitationsService({ db });
	orgsSvc = new OrgsService({ db });

	const [u] = await db
		.insert(schema.users)
		.values({ name: "Owner", email: "owner@test.com" })
		.returning();
	owner = u.id;

	const org = unwrap(await orgsSvc.create({ name: "Inv Org", slug: "inv-org", userId: owner }));
	orgId = org.id;
});

afterAll(async () => {
	await client.close();
});

beforeEach(async () => {
	await db.delete(schema.invitations);
});

describe("InvitationsService.send", () => {
	it("creates a pending invitation row", async () => {
		const inv = unwrap(
			await svc.send({ orgId, email: "new@test.com", role: "member", invitedBy: owner }),
		);
		expect(inv.id).toBeDefined();
		expect(inv.orgId).toBe(orgId);
		expect(inv.email).toBe("new@test.com");
		expect(inv.role).toBe("member");
		expect(inv.invitedBy).toBe(owner);
	});

	it("returns DuplicateMemberError on duplicate email (case-insensitive)", async () => {
		unwrap(await svc.send({ orgId, email: "dup@test.com", role: "member", invitedBy: owner }));
		const second = await svc.send({
			orgId,
			email: "DUP@test.com",
			role: "admin",
			invitedBy: owner,
		});
		expect(second).toBeInstanceOf(DuplicateMemberError);
	});

	it("allows the same email across different orgs", async () => {
		const otherOrg = unwrap(
			await orgsSvc.create({
				name: "Other",
				slug: `other-${Date.now()}`,
				userId: owner,
			}),
		);
		unwrap(await svc.send({ orgId, email: "x@test.com", role: "member", invitedBy: owner }));
		const second = unwrap(
			await svc.send({
				orgId: otherOrg.id,
				email: "x@test.com",
				role: "member",
				invitedBy: owner,
			}),
		);
		expect(second.orgId).toBe(otherOrg.id);
	});
});

describe("InvitationsService.list", () => {
	it("returns invitations for an org", async () => {
		await svc.send({ orgId, email: "a@test.com", role: "member", invitedBy: owner });
		await svc.send({ orgId, email: "b@test.com", role: "admin", invitedBy: owner });
		const rows = await svc.list(orgId);
		expect(rows).toHaveLength(2);
		const emails = rows.map((r) => r.email).sort();
		expect(emails).toEqual(["a@test.com", "b@test.com"]);
	});

	it("scopes results by orgId", async () => {
		const otherOrg = unwrap(
			await orgsSvc.create({
				name: "Scope",
				slug: `scope-${Date.now()}`,
				userId: owner,
			}),
		);
		await svc.send({ orgId, email: "a@test.com", role: "member", invitedBy: owner });
		const rows = await svc.list(otherOrg.id);
		expect(rows).toHaveLength(0);
	});
});

describe("InvitationsService.revoke", () => {
	it("deletes the invitation", async () => {
		const inv = unwrap(
			await svc.send({ orgId, email: "revoke@test.com", role: "member", invitedBy: owner }),
		);
		const deleted = unwrap(await svc.revoke({ orgId, invitationId: inv.id }));
		expect(deleted).not.toBeNull();
		expect(deleted?.id).toBe(inv.id);

		const rows = await svc.list(orgId);
		expect(rows).toHaveLength(0);
	});

	it("returns null when invitation belongs to a different org", async () => {
		const otherOrg = unwrap(
			await orgsSvc.create({
				name: "Cross",
				slug: `cross-${Date.now()}`,
				userId: owner,
			}),
		);
		const inv = unwrap(
			await svc.send({ orgId, email: "wrong@test.com", role: "member", invitedBy: owner }),
		);
		const result = await svc.revoke({ orgId: otherOrg.id, invitationId: inv.id });
		expect(result).toBeNull();

		const rows = await svc.list(orgId);
		expect(rows).toHaveLength(1);
	});

	it("returns null when invitation does not exist", async () => {
		const result = await svc.revoke({
			orgId,
			invitationId: "00000000-0000-0000-0000-000000000000",
		});
		expect(result).toBeNull();
	});
});

describe("InvitationsService.clearForEmail", () => {
	it("deletes all invitations for the email/org pair (case-insensitive)", async () => {
		await svc.send({ orgId, email: "Mixed@Test.com", role: "member", invitedBy: owner });
		await svc.clearForEmail({ orgId, email: "mixed@test.com" });
		const rows = await svc.list(orgId);
		expect(rows).toHaveLength(0);
	});

	it("does not affect invitations in other orgs", async () => {
		const otherOrg = unwrap(
			await orgsSvc.create({
				name: "Keep",
				slug: `keep-${Date.now()}`,
				userId: owner,
			}),
		);
		await svc.send({ orgId, email: "shared@test.com", role: "member", invitedBy: owner });
		await svc.send({
			orgId: otherOrg.id,
			email: "shared@test.com",
			role: "member",
			invitedBy: owner,
		});
		await svc.clearForEmail({ orgId, email: "shared@test.com" });

		const stillThere = await svc.list(otherOrg.id);
		expect(stillThere).toHaveLength(1);
	});
});

describe("InvitationsService.consume", () => {
	it("creates memberships, writes audit logs, and deletes invitations", async () => {
		const otherOrg = unwrap(
			await orgsSvc.create({
				name: "Two",
				slug: `two-${Date.now()}`,
				userId: owner,
			}),
		);
		await svc.send({ orgId, email: "consume@test.com", role: "member", invitedBy: owner });
		await svc.send({
			orgId: otherOrg.id,
			email: "consume@test.com",
			role: "admin",
			invitedBy: owner,
		});

		const [newUser] = await db
			.insert(schema.users)
			.values({ name: "Consume", email: "consume@test.com" })
			.returning();

		await svc.consume({ userId: newUser.id, email: "consume@test.com" });

		const memberships = await db
			.select()
			.from(schema.orgMembers)
			.where(eq(schema.orgMembers.userId, newUser.id));
		expect(memberships).toHaveLength(2);
		const byOrg = Object.fromEntries(memberships.map((m) => [m.orgId, m.role]));
		expect(byOrg[orgId]).toBe("member");
		expect(byOrg[otherOrg.id]).toBe("admin");

		const logs = await db
			.select()
			.from(schema.auditLogs)
			.where(
				and(
					eq(schema.auditLogs.actorId, newUser.id),
					eq(schema.auditLogs.action, "invitation.consume"),
				),
			);
		expect(logs).toHaveLength(2);

		const remaining = await db.select().from(schema.invitations);
		expect(remaining).toHaveLength(0);
	});

	it("is a no-op when no invitations match", async () => {
		const [u] = await db
			.insert(schema.users)
			.values({ name: "NoInv", email: "noinv@test.com" })
			.returning();

		await expect(
			svc.consume({ userId: u.id, email: "noinv@test.com" }),
		).resolves.toBeUndefined();

		const memberships = await db
			.select()
			.from(schema.orgMembers)
			.where(eq(schema.orgMembers.userId, u.id));
		expect(memberships).toHaveLength(0);
	});

	it("matches case-insensitively", async () => {
		await svc.send({ orgId, email: "Case@Test.com", role: "member", invitedBy: owner });
		const [u] = await db
			.insert(schema.users)
			.values({ name: "Case", email: "case@test.com" })
			.returning();

		await svc.consume({ userId: u.id, email: "case@test.com" });

		const memberships = await db
			.select()
			.from(schema.orgMembers)
			.where(eq(schema.orgMembers.userId, u.id));
		expect(memberships).toHaveLength(1);
	});
});

describe("expiry", () => {
	it("sets expiresAt ~7 days in the future by default", async () => {
		const inv = unwrap(
			await svc.send({ orgId, email: "exp@test.com", role: "member", invitedBy: owner }),
		);
		const delta = inv.expiresAt.getTime() - inv.createdAt.getTime();
		const sevenDays = 7 * 24 * 60 * 60 * 1000;
		expect(delta).toBeGreaterThan(sevenDays - 60_000);
		expect(delta).toBeLessThan(sevenDays + 60_000);
	});

	it("list excludes expired rows", async () => {
		await svc.send({ orgId, email: "fresh@test.com", role: "member", invitedBy: owner });
		await db.insert(schema.invitations).values({
			orgId,
			email: "stale@test.com",
			role: "member",
			invitedBy: owner,
			expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
		});

		const rows = await svc.list(orgId);
		expect(rows.map((r) => r.email)).toEqual(["fresh@test.com"]);
	});

	it("consume skips expired rows (membership not created, row left for cleanup)", async () => {
		await db.insert(schema.invitations).values({
			orgId,
			email: "old@test.com",
			role: "admin",
			invitedBy: owner,
			expiresAt: new Date(Date.now() - 1000),
		});

		const [u] = await db
			.insert(schema.users)
			.values({ name: "Old", email: "old@test.com" })
			.returning();

		await svc.consume({ userId: u.id, email: "old@test.com" });

		const memberships = await db
			.select()
			.from(schema.orgMembers)
			.where(eq(schema.orgMembers.userId, u.id));
		expect(memberships).toHaveLength(0);
	});
});

describe("InvitationsService.findUserByEmail", () => {
	it("returns the user when present (case-insensitive)", async () => {
		const [u] = await db
			.insert(schema.users)
			.values({ name: "Find", email: "Find@Test.com" })
			.returning();

		const found = await svc.findUserByEmail("find@test.com");
		expect(found).not.toBeNull();
		expect(found!.id).toBe(u.id);
	});

	it("returns null when not found", async () => {
		const found = await svc.findUserByEmail("nobody@test.com");
		expect(found).toBeNull();
	});
});
