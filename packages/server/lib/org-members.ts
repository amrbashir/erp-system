import { orgMembers, users } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

type DB = PgDatabase<any, any>;
type Role = "owner" | "admin" | "member";

export async function getOrgMembers(db: DB, orgId: string) {
	return db
		.select({
			id: orgMembers.id,
			userId: orgMembers.userId,
			orgId: orgMembers.orgId,
			role: orgMembers.role,
			userName: users.name,
			userEmail: users.email,
			createdAt: orgMembers.createdAt,
		})
		.from(orgMembers)
		.innerJoin(users, eq(orgMembers.userId, users.id))
		.where(eq(orgMembers.orgId, orgId));
}

export async function addMemberToOrg(db: DB, input: { orgId: string; userId: string; role: Role }) {
	const [row] = await db
		.insert(orgMembers)
		.values({
			orgId: input.orgId,
			userId: input.userId,
			role: input.role,
		})
		.returning();
	return row;
}

async function countOwners(db: DB, orgId: string): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(orgMembers)
		.where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "owner")));
	return result?.count ?? 0;
}

export async function updateMemberRole(
	db: DB,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
		newRole: Role;
		actorMemberId?: string;
	},
) {
	if (input.actorRole === "member") {
		throw new Error("No permission to change roles");
	}
	if (input.actorRole === "admin" && input.newRole !== "member") {
		throw new Error("No permission to assign this role");
	}

	// block owner self-demotion (must use transfer flow)
	if (input.actorMemberId && input.actorMemberId === input.memberId) {
		throw new Error("Cannot change your own role");
	}

	const [target] = await db
		.select({ role: orgMembers.role })
		.from(orgMembers)
		.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
		.limit(1);

	if (input.actorRole === "admin") {
		if (!target) throw new Error("Member not found");
		if (target.role !== "member") {
			throw new Error("No permission to change this member's role");
		}
	}

	// prevent demoting last owner
	if (input.newRole !== "owner" && target?.role === "owner") {
		const ownerCount = await countOwners(db, input.orgId);
		if (ownerCount <= 1) {
			throw new Error("Cannot demote the last owner of the organization");
		}
	}

	const [updated] = await db
		.update(orgMembers)
		.set({ role: input.newRole })
		.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
		.returning();

	if (!updated) throw new Error("Member not found");
	return updated;
}

export async function removeMember(
	db: DB,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
	},
) {
	if (input.actorRole === "member") {
		throw new Error("No permission to remove members");
	}

	const [target] = await db
		.select({ role: orgMembers.role })
		.from(orgMembers)
		.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
		.limit(1);

	// admin can only remove members, not owners/admins
	if (input.actorRole === "admin") {
		if (!target) throw new Error("Member not found");
		if (target.role !== "member") {
			throw new Error("No permission to remove this member");
		}
	}

	// prevent removing last owner
	if (target?.role === "owner") {
		const ownerCount = await countOwners(db, input.orgId);
		if (ownerCount <= 1) {
			throw new Error("Cannot remove the last owner of the organization");
		}
	}

	const [deleted] = await db
		.delete(orgMembers)
		.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
		.returning();

	if (!deleted) throw new Error("Member not found");
	return deleted;
}

export async function transferOwnership(
	db: DB,
	input: {
		orgId: string;
		actorMemberId: string;
		targetMemberId: string;
		newActorRole: "admin" | "member";
	},
) {
	if (input.actorMemberId === input.targetMemberId) {
		throw new Error("Cannot transfer ownership to yourself");
	}

	const [actor] = await db
		.select({ role: orgMembers.role })
		.from(orgMembers)
		.where(and(eq(orgMembers.id, input.actorMemberId), eq(orgMembers.orgId, input.orgId)))
		.limit(1);

	if (!actor || actor.role !== "owner") {
		throw new Error("Only owners can transfer ownership");
	}

	const [target] = await db
		.select({ role: orgMembers.role })
		.from(orgMembers)
		.where(and(eq(orgMembers.id, input.targetMemberId), eq(orgMembers.orgId, input.orgId)))
		.limit(1);

	if (!target) {
		throw new Error("Target member not found");
	}

	return db.transaction(async (tx) => {
		const [updatedTarget] = await tx
			.update(orgMembers)
			.set({ role: "owner" })
			.where(and(eq(orgMembers.id, input.targetMemberId), eq(orgMembers.orgId, input.orgId)))
			.returning();

		const [updatedActor] = await tx
			.update(orgMembers)
			.set({ role: input.newActorRole })
			.where(and(eq(orgMembers.id, input.actorMemberId), eq(orgMembers.orgId, input.orgId)))
			.returning();

		return { target: updatedTarget, actor: updatedActor };
	});
}
