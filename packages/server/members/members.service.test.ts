import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { OrgsService } from "../orgs/orgs.service.js";
import {
	DuplicateMemberError,
	LastOwnerError,
	NoPermissionError,
	SelfRoleChangeError,
	SelfTransferError,
	TargetMemberNotFoundError,
} from "../shared/errors.js";

import { MembersService } from "./members.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let svc: MembersService;
let orgsSvc: OrgsService;

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
	svc = new MembersService({ db: db as any });
	orgsSvc = new OrgsService({ db: db as any });

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

	for (const uid of [owner, admin, member, outsider]) {
		await db.insert(schema.accounts).values({
			userId: uid,
			accountId: uid,
			providerId: "credential",
			password: "hashed",
		});
	}

	const org = unwrap(await orgsSvc.create({ name: "Test Org", slug: "test-org", userId: owner }));
	orgId = org.id;

	unwrap(await svc.add({ orgId, userId: admin, role: "admin" }));
	unwrap(await svc.add({ orgId, userId: member, role: "member" }));
});

afterAll(async () => {
	await client.close();
});

describe("MembersService.list", () => {
	it("returns all members with user info", async () => {
		const members = await svc.list(orgId);
		expect(members).toHaveLength(3);
		const roles = members.map((m) => m.role).sort();
		expect(roles).toEqual(["admin", "member", "owner"]);
		expect(members.find((m) => m.role === "owner")?.userName).toBe("Owner");
	});

	it("returns just the creator for a fresh org", async () => {
		const org2 = unwrap(
			await orgsSvc.create({ name: "Empty Org", slug: "empty-org", userId: outsider }),
		);
		const members = await svc.list(org2.id);
		expect(members).toHaveLength(1);
	});
});

describe("MembersService.add", () => {
	it("adds user to org with given role", async () => {
		const [newUser] = await db
			.insert(schema.users)
			.values({ name: "NewUser", email: "new@test.com" })
			.returning();
		unwrap(await svc.add({ orgId, userId: newUser.id, role: "member" }));
		const membership = await orgsSvc.getMembership(newUser.id, orgId);
		expect(membership).not.toBeNull();
		expect(membership!.role).toBe("member");
	});

	it("returns DuplicateMemberError on duplicate membership", async () => {
		const result = await svc.add({ orgId, userId: owner, role: "member" });
		expect(result).toBeInstanceOf(DuplicateMemberError);
	});
});

describe("MembersService.updateRole", () => {
	it("owner can change any role", async () => {
		const m = await orgsSvc.getMembership(member, orgId);
		const updated = unwrap(
			await svc.updateRole({
				memberId: m!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
		expect(updated.role).toBe("admin");
		unwrap(
			await svc.updateRole({
				memberId: m!.id,
				orgId,
				actorRole: "owner",
				newRole: "member",
			}),
		);
	});

	it("admin cannot promote to owner", async () => {
		const m = await orgsSvc.getMembership(member, orgId);
		const result = await svc.updateRole({
			memberId: m!.id,
			orgId,
			actorRole: "admin",
			newRole: "owner",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot promote to admin", async () => {
		const m = await orgsSvc.getMembership(member, orgId);
		const result = await svc.updateRole({
			memberId: m!.id,
			orgId,
			actorRole: "admin",
			newRole: "admin",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot modify owner role", async () => {
		const m = await orgsSvc.getMembership(owner, orgId);
		const result = await svc.updateRole({
			memberId: m!.id,
			orgId,
			actorRole: "admin",
			newRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot modify admin role", async () => {
		const m = await orgsSvc.getMembership(admin, orgId);
		const result = await svc.updateRole({
			memberId: m!.id,
			orgId,
			actorRole: "admin",
			newRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("member cannot change roles", async () => {
		const m = await orgsSvc.getMembership(admin, orgId);
		const result = await svc.updateRole({
			memberId: m!.id,
			orgId,
			actorRole: "member",
			newRole: "member",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});
});

describe("MembersService.remove", () => {
	it("owner can remove a member", async () => {
		const [tempUser] = await db
			.insert(schema.users)
			.values({ name: "Temp", email: "temp@test.com" })
			.returning();
		unwrap(await svc.add({ orgId, userId: tempUser.id, role: "member" }));
		const m = await orgsSvc.getMembership(tempUser.id, orgId);
		unwrap(await svc.remove({ memberId: m!.id, orgId, actorRole: "owner" }));
		const after = await orgsSvc.getMembership(tempUser.id, orgId);
		expect(after).toBeNull();
	});

	it("admin can remove a member", async () => {
		const [tempUser] = await db
			.insert(schema.users)
			.values({ name: "Temp2", email: "temp2@test.com" })
			.returning();
		unwrap(await svc.add({ orgId, userId: tempUser.id, role: "member" }));
		const m = await orgsSvc.getMembership(tempUser.id, orgId);
		unwrap(await svc.remove({ memberId: m!.id, orgId, actorRole: "admin" }));
		const after = await orgsSvc.getMembership(tempUser.id, orgId);
		expect(after).toBeNull();
	});

	it("member cannot remove anyone", async () => {
		const m = await orgsSvc.getMembership(admin, orgId);
		const result = await svc.remove({ memberId: m!.id, orgId, actorRole: "member" });
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot remove an owner", async () => {
		const m = await orgsSvc.getMembership(owner, orgId);
		const result = await svc.remove({ memberId: m!.id, orgId, actorRole: "admin" });
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("admin cannot remove another admin", async () => {
		const m = await orgsSvc.getMembership(admin, orgId);
		const result = await svc.remove({ memberId: m!.id, orgId, actorRole: "admin" });
		expect(result).toBeInstanceOf(NoPermissionError);
	});
});

describe("last-owner protection", () => {
	it("returns LastOwnerError when removing the last owner", async () => {
		const m = await orgsSvc.getMembership(owner, orgId);
		const result = await svc.remove({ memberId: m!.id, orgId, actorRole: "owner" });
		expect(result).toBeInstanceOf(LastOwnerError);
	});

	it("returns LastOwnerError when demoting the last owner", async () => {
		const m = await orgsSvc.getMembership(owner, orgId);
		const result = await svc.updateRole({
			memberId: m!.id,
			orgId,
			actorRole: "owner",
			newRole: "admin",
		});
		expect(result).toBeInstanceOf(LastOwnerError);
	});

	it("allows removing a non-last owner", async () => {
		const adminM = await orgsSvc.getMembership(admin, orgId);
		unwrap(
			await svc.updateRole({
				memberId: adminM!.id,
				orgId,
				actorRole: "owner",
				newRole: "owner",
			}),
		);

		const ownerM = await orgsSvc.getMembership(owner, orgId);
		const deleted = unwrap(
			await svc.remove({ memberId: ownerM!.id, orgId, actorRole: "owner" }),
		);
		expect(deleted).toBeDefined();

		// restore
		unwrap(await svc.add({ orgId, userId: owner, role: "owner" }));
		unwrap(
			await svc.updateRole({
				memberId: adminM!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("allows demoting a non-last owner", async () => {
		const adminM = await orgsSvc.getMembership(admin, orgId);
		unwrap(
			await svc.updateRole({
				memberId: adminM!.id,
				orgId,
				actorRole: "owner",
				newRole: "owner",
			}),
		);

		const ownerM = await orgsSvc.getMembership(owner, orgId);
		const updated = unwrap(
			await svc.updateRole({
				memberId: ownerM!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
		expect(updated.role).toBe("admin");

		unwrap(
			await svc.updateRole({
				memberId: ownerM!.id,
				orgId,
				actorRole: "owner",
				newRole: "owner",
			}),
		);
		unwrap(
			await svc.updateRole({
				memberId: adminM!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("returns SelfRoleChangeError on owner self-demotion", async () => {
		const ownerM = await orgsSvc.getMembership(owner, orgId);
		const result = await svc.updateRole({
			memberId: ownerM!.id,
			orgId,
			actorRole: "owner",
			newRole: "admin",
			actorMemberId: ownerM!.id,
		});
		expect(result).toBeInstanceOf(SelfRoleChangeError);
	});
});

describe("MembersService.transferOwnership", () => {
	it("promotes target to owner and demotes actor", async () => {
		const ownerM = await orgsSvc.getMembership(owner, orgId);
		const adminM = await orgsSvc.getMembership(admin, orgId);

		const result = unwrap(
			await svc.transferOwnership({
				orgId,
				actorMemberId: ownerM!.id,
				targetMemberId: adminM!.id,
				newActorRole: "admin",
			}),
		);

		expect(result.target.role).toBe("owner");
		expect(result.actor.role).toBe("admin");

		// restore
		unwrap(
			await svc.transferOwnership({
				orgId,
				actorMemberId: adminM!.id,
				targetMemberId: ownerM!.id,
				newActorRole: "admin",
			}),
		);
		unwrap(
			await svc.updateRole({
				memberId: adminM!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("allows demoting to member role", async () => {
		const ownerM = await orgsSvc.getMembership(owner, orgId);
		const adminM = await orgsSvc.getMembership(admin, orgId);

		const result = unwrap(
			await svc.transferOwnership({
				orgId,
				actorMemberId: ownerM!.id,
				targetMemberId: adminM!.id,
				newActorRole: "member",
			}),
		);

		expect(result.target.role).toBe("owner");
		expect(result.actor.role).toBe("member");

		unwrap(
			await svc.transferOwnership({
				orgId,
				actorMemberId: adminM!.id,
				targetMemberId: ownerM!.id,
				newActorRole: "admin",
			}),
		);
		unwrap(
			await svc.updateRole({
				memberId: adminM!.id,
				orgId,
				actorRole: "owner",
				newRole: "admin",
			}),
		);
	});

	it("returns NoPermissionError if actor is not an owner", async () => {
		const adminM = await orgsSvc.getMembership(admin, orgId);
		const memberM = await orgsSvc.getMembership(member, orgId);

		const result = await svc.transferOwnership({
			orgId,
			actorMemberId: adminM!.id,
			targetMemberId: memberM!.id,
			newActorRole: "admin",
		});
		expect(result).toBeInstanceOf(NoPermissionError);
	});

	it("returns TargetMemberNotFoundError if target is not a member", async () => {
		const ownerM = await orgsSvc.getMembership(owner, orgId);
		const fakeId = "00000000-0000-0000-0000-000000000000";

		const result = await svc.transferOwnership({
			orgId,
			actorMemberId: ownerM!.id,
			targetMemberId: fakeId,
			newActorRole: "admin",
		});
		expect(result).toBeInstanceOf(TargetMemberNotFoundError);
	});

	it("returns SelfTransferError when transferring to self", async () => {
		const ownerM = await orgsSvc.getMembership(owner, orgId);

		const result = await svc.transferOwnership({
			orgId,
			actorMemberId: ownerM!.id,
			targetMemberId: ownerM!.id,
			newActorRole: "admin",
		});
		expect(result).toBeInstanceOf(SelfTransferError);
	});
});
