import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { getOrgMembers, addMemberToOrg, updateMemberRole, removeMember } from "./org-members.js";
import { createOrg, getOrgMembership } from "./org.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

let owner: string;
let admin: string;
let member: string;
let outsider: string;
let orgId: string;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });

	// seed users
	const [u1] = await db
		.insert(schema.users)
		.values({ name: "Owner", email: "owner@test.com" })
		.returning();
	const [u2] = await db
		.insert(schema.users)
		.values({ name: "Admin", email: "admin@test.com" })
		.returning();
	const [u3] = await db
		.insert(schema.users)
		.values({ name: "Member", email: "member@test.com" })
		.returning();
	const [u4] = await db
		.insert(schema.users)
		.values({ name: "Outsider", email: "outsider@test.com" })
		.returning();

	owner = u1.id;
	admin = u2.id;
	member = u3.id;
	outsider = u4.id;

	// create org with owner
	const org = await createOrg(db as any, {
		name: "Test Org",
		slug: "test-org",
		userId: owner,
	});
	orgId = org.id;

	// add admin and member
	await addMemberToOrg(db as any, { orgId, userId: admin, role: "admin" });
	await addMemberToOrg(db as any, { orgId, userId: member, role: "member" });
});

afterAll(async () => {
	await client.close();
});

describe("getOrgMembers", () => {
	it("returns all members with user info", async () => {
		const members = await getOrgMembers(db as any, orgId);
		expect(members).toHaveLength(3);
		const roles = members.map((m) => m.role).sort();
		expect(roles).toEqual(["admin", "member", "owner"]);
		// includes user fields
		expect(members.find((m) => m.role === "owner")?.userName).toBe("Owner");
	});

	it("returns empty for org with no extra members besides what exists", async () => {
		const org2 = await createOrg(db as any, {
			name: "Empty Org",
			slug: "empty-org",
			userId: outsider,
		});
		const members = await getOrgMembers(db as any, org2.id);
		expect(members).toHaveLength(1); // just the owner
	});
});

describe("addMemberToOrg", () => {
	it("adds user to org with given role", async () => {
		const newUser = await db
			.insert(schema.users)
			.values({ name: "NewUser", email: "new@test.com" })
			.returning();
		await addMemberToOrg(db as any, {
			orgId,
			userId: newUser[0].id,
			role: "member",
		});
		const membership = await getOrgMembership(db as any, newUser[0].id, orgId);
		expect(membership).not.toBeNull();
		expect(membership!.role).toBe("member");
	});

	it("rejects duplicate membership", async () => {
		await expect(
			addMemberToOrg(db as any, { orgId, userId: owner, role: "member" }),
		).rejects.toThrow();
	});
});

describe("updateMemberRole", () => {
	it("owner can change any role", async () => {
		const membership = await getOrgMembership(db as any, member, orgId);
		const updated = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "owner",
			newRole: "admin",
		});
		expect(updated.role).toBe("admin");
		// restore
		await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "owner",
			newRole: "member",
		});
	});

	it("admin cannot promote to owner", async () => {
		const membership = await getOrgMembership(db as any, member, orgId);
		await expect(
			updateMemberRole(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "admin",
				newRole: "owner",
			}),
		).rejects.toThrow(/permission/i);
	});

	it("admin cannot promote to admin", async () => {
		const membership = await getOrgMembership(db as any, member, orgId);
		await expect(
			updateMemberRole(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "admin",
				newRole: "admin",
			}),
		).rejects.toThrow(/permission/i);
	});

	it("member cannot change roles", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		await expect(
			updateMemberRole(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "member",
				newRole: "member",
			}),
		).rejects.toThrow(/permission/i);
	});
});

describe("removeMember", () => {
	it("owner can remove a member", async () => {
		const tempUser = await db
			.insert(schema.users)
			.values({ name: "Temp", email: "temp@test.com" })
			.returning();
		await addMemberToOrg(db as any, {
			orgId,
			userId: tempUser[0].id,
			role: "member",
		});
		const membership = await getOrgMembership(db as any, tempUser[0].id, orgId);
		await removeMember(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "owner",
		});
		const after = await getOrgMembership(db as any, tempUser[0].id, orgId);
		expect(after).toBeNull();
	});

	it("admin can remove a member", async () => {
		const tempUser = await db
			.insert(schema.users)
			.values({ name: "Temp2", email: "temp2@test.com" })
			.returning();
		await addMemberToOrg(db as any, {
			orgId,
			userId: tempUser[0].id,
			role: "member",
		});
		const membership = await getOrgMembership(db as any, tempUser[0].id, orgId);
		await removeMember(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
		});
		const after = await getOrgMembership(db as any, tempUser[0].id, orgId);
		expect(after).toBeNull();
	});

	it("member cannot remove anyone", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		await expect(
			removeMember(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "member",
			}),
		).rejects.toThrow(/permission/i);
	});

	it("admin cannot remove an owner", async () => {
		const membership = await getOrgMembership(db as any, owner, orgId);
		await expect(
			removeMember(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "admin",
			}),
		).rejects.toThrow(/permission/i);
	});

	it("admin cannot remove another admin", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		await expect(
			removeMember(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "admin",
			}),
		).rejects.toThrow(/permission/i);
	});
});
