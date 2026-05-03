import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import {
	DuplicateMemberError,
	LastOwnerError,
	NoPermissionError,
	SelfRoleChangeError,
	SelfTransferError,
	TargetMemberNotFoundError,
} from "../shared/errors.js";

import {
	getOrgMembers,
	addMemberToOrg,
	updateMemberRole,
	removeMember,
	transferOwnership,
} from "./org-members.js";
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

function unwrap<T>(v: T): Exclude<T, Error> {
	if (v instanceof Error) throw v;
	return v as Exclude<T, Error>;
}

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

	// seed accounts so users are considered "claimed"
	for (const uid of [owner, admin, member, outsider]) {
		await db.insert(schema.accounts).values({
			userId: uid,
			accountId: uid,
			providerId: "credential",
			password: "hashed",
		});
	}

	// create org with owner
	const org = unwrap(
		await createOrg(db as any, {
			name: "Test Org",
			slug: "test-org",
			userId: owner,
		}),
	);
	orgId = org.id;

	// add admin and member
	unwrap(await addMemberToOrg(db as any, { orgId, userId: admin, role: "admin" }));
	unwrap(await addMemberToOrg(db as any, { orgId, userId: member, role: "member" }));
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
		const org2 = unwrap(
			await createOrg(db as any, {
				name: "Empty Org",
				slug: "empty-org",
				userId: outsider,
			}),
		);
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
		unwrap(
			await addMemberToOrg(db as any, {
				orgId,
				userId: newUser[0].id,
				role: "member",
			}),
		);
		const membership = await getOrgMembership(db as any, newUser[0].id, orgId);
		expect(membership).not.toBeNull();
		expect(membership!.role).toBe("member");
	});

	it("returns DuplicateMemberError on duplicate membership", async () => {
		const result = await addMemberToOrg(db as any, { orgId, userId: owner, role: "member" });
		expect(result).toBeInstanceOf(DuplicateMemberError);
	});
});

describe("updateMemberRole", () => {
	it("owner can change any role", async () => {
		const membership = await getOrgMembership(db as any, member, orgId);
		const updated = unwrap(
			await updateMemberRole(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
		expect(updated.role).toBe("admin");
		// restore
		unwrap(
			await updateMemberRole(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "owner",
				newRole: "member",
			}),
		);
	});

	it("admin cannot promote to owner", async () => {
		const membership = await getOrgMembership(db as any, member, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
			newRole: "owner",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot promote to admin", async () => {
		const membership = await getOrgMembership(db as any, member, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
			newRole: "admin",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot modify owner role", async () => {
		const membership = await getOrgMembership(db as any, owner, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
			newRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot modify admin role", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
			newRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("member cannot change roles", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "member",
			newRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});
});

describe("removeMember", () => {
	it("owner can remove a member", async () => {
		const tempUser = await db
			.insert(schema.users)
			.values({ name: "Temp", email: "temp@test.com" })
			.returning();
		unwrap(
			await addMemberToOrg(db as any, {
				orgId,
				userId: tempUser[0].id,
				role: "member",
			}),
		);
		const membership = await getOrgMembership(db as any, tempUser[0].id, orgId);
		unwrap(
			await removeMember(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "owner",
			}),
		);
		const after = await getOrgMembership(db as any, tempUser[0].id, orgId);
		expect(after).toBeNull();
	});

	it("admin can remove a member", async () => {
		const tempUser = await db
			.insert(schema.users)
			.values({ name: "Temp2", email: "temp2@test.com" })
			.returning();
		unwrap(
			await addMemberToOrg(db as any, {
				orgId,
				userId: tempUser[0].id,
				role: "member",
			}),
		);
		const membership = await getOrgMembership(db as any, tempUser[0].id, orgId);
		unwrap(
			await removeMember(db as any, {
				memberId: membership!.id,
				orgId,
				actorRole: "admin",
			}),
		);
		const after = await getOrgMembership(db as any, tempUser[0].id, orgId);
		expect(after).toBeNull();
	});

	it("member cannot remove anyone", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		const result = await removeMember(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot remove an owner", async () => {
		const membership = await getOrgMembership(db as any, owner, orgId);
		const result = await removeMember(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot remove another admin", async () => {
		const membership = await getOrgMembership(db as any, admin, orgId);
		const result = await removeMember(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "admin",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});
});

describe("last-owner protection", () => {
	it("returns LastOwnerError when removing the last owner", async () => {
		const membership = await getOrgMembership(db as any, owner, orgId);
		const result = await removeMember(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "owner",
		});
		expect(result).toBeInstanceOf(LastOwnerError);
	});

	it("returns LastOwnerError when demoting the last owner", async () => {
		const membership = await getOrgMembership(db as any, owner, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: membership!.id,
			orgId,
			actorRole: "owner",
			newRole: "admin",
		});
		expect(result).toBeInstanceOf(LastOwnerError);
	});

	it("allows removing a non-last owner", async () => {
		// promote admin to owner so there are 2 owners
		const adminMembership = await getOrgMembership(db as any, admin, orgId);
		unwrap(
			await updateMemberRole(db as any, {
				memberId: adminMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "owner",
			}),
		);

		// now removing original owner should succeed
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);
		const deleted = unwrap(
			await removeMember(db as any, {
				memberId: ownerMembership!.id,
				orgId,
				actorRole: "owner",
			}),
		);
		expect(deleted).toBeDefined();

		// restore: re-add owner and demote admin back
		unwrap(await addMemberToOrg(db as any, { orgId, userId: owner, role: "owner" }));
		unwrap(
			await updateMemberRole(db as any, {
				memberId: adminMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("allows demoting a non-last owner", async () => {
		// promote admin to owner so there are 2 owners
		const adminMembership = await getOrgMembership(db as any, admin, orgId);
		unwrap(
			await updateMemberRole(db as any, {
				memberId: adminMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "owner",
			}),
		);

		// now demoting original owner should succeed
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);
		const updated = unwrap(
			await updateMemberRole(db as any, {
				memberId: ownerMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
		expect(updated.role).toBe("admin");

		// restore
		unwrap(
			await updateMemberRole(db as any, {
				memberId: ownerMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "owner",
			}),
		);
		unwrap(
			await updateMemberRole(db as any, {
				memberId: adminMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("returns SelfRoleChangeError on owner self-demotion via updateMemberRole", async () => {
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);
		const result = await updateMemberRole(db as any, {
			memberId: ownerMembership!.id,
			orgId,
			actorRole: "owner",
			newRole: "admin",
			actorMemberId: ownerMembership!.id,
		});
		expect(result).toBeInstanceOf(SelfRoleChangeError);
	});
});

describe("transferOwnership", () => {
	it("promotes target to owner and demotes actor to chosen role", async () => {
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);
		const adminMembership = await getOrgMembership(db as any, admin, orgId);

		const result = unwrap(
			await transferOwnership(db as any, {
				orgId,
				actorMemberId: ownerMembership!.id,
				targetMemberId: adminMembership!.id,
				newActorRole: "admin",
			}),
		);

		expect(result.target.role).toBe("owner");
		expect(result.actor.role).toBe("admin");

		// restore: transfer back
		unwrap(
			await transferOwnership(db as any, {
				orgId,
				actorMemberId: adminMembership!.id,
				targetMemberId: ownerMembership!.id,
				newActorRole: "admin",
			}),
		);
		// restore admin back to admin role
		unwrap(
			await updateMemberRole(db as any, {
				memberId: adminMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("allows demoting to member role", async () => {
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);
		const adminMembership = await getOrgMembership(db as any, admin, orgId);

		const result = unwrap(
			await transferOwnership(db as any, {
				orgId,
				actorMemberId: ownerMembership!.id,
				targetMemberId: adminMembership!.id,
				newActorRole: "member",
			}),
		);

		expect(result.target.role).toBe("owner");
		expect(result.actor.role).toBe("member");

		// restore
		unwrap(
			await transferOwnership(db as any, {
				orgId,
				actorMemberId: adminMembership!.id,
				targetMemberId: ownerMembership!.id,
				newActorRole: "admin",
			}),
		);
		unwrap(
			await updateMemberRole(db as any, {
				memberId: adminMembership!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("returns NoPermissionError if actor is not an owner", async () => {
		const adminMembership = await getOrgMembership(db as any, admin, orgId);
		const memberMembership = await getOrgMembership(db as any, member, orgId);

		const result = await transferOwnership(db as any, {
			orgId,
			actorMemberId: adminMembership!.id,
			targetMemberId: memberMembership!.id,
			newActorRole: "admin",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("returns TargetMemberNotFoundError if target is not a member", async () => {
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);
		const fakeId = "00000000-0000-0000-0000-000000000000";

		const result = await transferOwnership(db as any, {
			orgId,
			actorMemberId: ownerMembership!.id,
			targetMemberId: fakeId,
			newActorRole: "admin",
		});
		expect(result).toBeInstanceOf(TargetMemberNotFoundError);
	});

	it("returns SelfTransferError when transferring to self", async () => {
		const ownerMembership = await getOrgMembership(db as any, owner, orgId);

		const result = await transferOwnership(db as any, {
			orgId,
			actorMemberId: ownerMembership!.id,
			targetMemberId: ownerMembership!.id,
			newActorRole: "admin",
		});
		expect(result).toBeInstanceOf(SelfTransferError);
	});
});
