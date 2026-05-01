import { orgMembers, users } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import {
	DuplicateMemberError,
	LastOwnerError,
	MemberNotFoundError,
	NoPermissionError,
	SelfRoleChangeError,
	SelfTransferError,
	TargetMemberNotFoundError,
} from "./errors.js";

type DB = PgDatabase<any, any>;
type Role = "owner" | "admin" | "member";
type OrgMember = typeof orgMembers.$inferSelect;

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

export async function addMemberToOrg(
	db: DB,
	input: { orgId: string; userId: string; role: Role },
): Promise<DuplicateMemberError | Error | OrgMember> {
	try {
		const [row] = await db
			.insert(orgMembers)
			.values({
				orgId: input.orgId,
				userId: input.userId,
				role: input.role,
			})
			.returning();
		return row;
	} catch (e: any) {
		if (e?.code === "23505" || e?.cause?.code === "23505" || /unique/i.test(e?.message ?? "")) {
			return new DuplicateMemberError();
		}
		if (e instanceof Error) return e;
		throw e;
	}
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
): Promise<
	| NoPermissionError
	| SelfRoleChangeError
	| MemberNotFoundError
	| LastOwnerError
	| Error
	| OrgMember
> {
	if (input.actorRole === "member") {
		return new NoPermissionError({ reason: "No permission to change roles" });
	}
	if (input.actorRole === "admin" && input.newRole !== "member") {
		return new NoPermissionError({ reason: "No permission to assign this role" });
	}

	// block owner self-demotion (must use transfer flow)
	if (input.actorMemberId && input.actorMemberId === input.memberId) {
		return new SelfRoleChangeError();
	}

	try {
		return await db.transaction(async (tx) => {
			const [target] = await tx
				.select({ role: orgMembers.role })
				.from(orgMembers)
				.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
				.limit(1);

			if (input.actorRole === "admin") {
				if (!target) throw new MemberNotFoundError();
				if (target.role !== "member") {
					throw new NoPermissionError({
						reason: "No permission to change this member's role",
					});
				}
			}

			// prevent demoting last owner
			if (input.newRole !== "owner" && target?.role === "owner") {
				const ownerCount = await countOwners(tx, input.orgId);
				if (ownerCount <= 1) {
					throw new LastOwnerError({ action: "demote" });
				}
			}

			const [updated] = await tx
				.update(orgMembers)
				.set({ role: input.newRole })
				.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
				.returning();

			if (!updated) throw new MemberNotFoundError();
			return updated;
		});
	} catch (e) {
		if (
			e instanceof NoPermissionError ||
			e instanceof MemberNotFoundError ||
			e instanceof LastOwnerError
		) {
			return e;
		}
		if (e instanceof Error) return e;
		throw e;
	}
}

export async function removeMember(
	db: DB,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
	},
): Promise<NoPermissionError | MemberNotFoundError | LastOwnerError | Error | OrgMember> {
	if (input.actorRole === "member") {
		return new NoPermissionError({ reason: "No permission to remove members" });
	}

	try {
		return await db.transaction(async (tx) => {
			const [target] = await tx
				.select({ role: orgMembers.role })
				.from(orgMembers)
				.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
				.limit(1);

			// admin can only remove members, not owners/admins
			if (input.actorRole === "admin") {
				if (!target) throw new MemberNotFoundError();
				if (target.role !== "member") {
					throw new NoPermissionError({ reason: "No permission to remove this member" });
				}
			}

			// prevent removing last owner
			if (target?.role === "owner") {
				const ownerCount = await countOwners(tx, input.orgId);
				if (ownerCount <= 1) {
					throw new LastOwnerError({ action: "remove" });
				}
			}

			const [deleted] = await tx
				.delete(orgMembers)
				.where(and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)))
				.returning();

			if (!deleted) throw new MemberNotFoundError();
			return deleted;
		});
	} catch (e) {
		if (
			e instanceof NoPermissionError ||
			e instanceof MemberNotFoundError ||
			e instanceof LastOwnerError
		) {
			return e;
		}
		if (e instanceof Error) return e;
		throw e;
	}
}

export async function transferOwnership(
	db: DB,
	input: {
		orgId: string;
		actorMemberId: string;
		targetMemberId: string;
		newActorRole: "admin" | "member";
	},
): Promise<
	| SelfTransferError
	| NoPermissionError
	| TargetMemberNotFoundError
	| Error
	| { target: OrgMember; actor: OrgMember }
> {
	if (input.actorMemberId === input.targetMemberId) {
		return new SelfTransferError();
	}

	try {
		return await db.transaction(async (tx) => {
			const [actor] = await tx
				.select({ role: orgMembers.role })
				.from(orgMembers)
				.where(and(eq(orgMembers.id, input.actorMemberId), eq(orgMembers.orgId, input.orgId)))
				.limit(1);

			if (!actor || actor.role !== "owner") {
				throw new NoPermissionError({ reason: "Only owners can transfer ownership" });
			}

			const [target] = await tx
				.select({ role: orgMembers.role })
				.from(orgMembers)
				.where(and(eq(orgMembers.id, input.targetMemberId), eq(orgMembers.orgId, input.orgId)))
				.limit(1);

			if (!target) {
				throw new TargetMemberNotFoundError();
			}

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
	} catch (e) {
		if (e instanceof NoPermissionError || e instanceof TargetMemberNotFoundError) {
			return e;
		}
		if (e instanceof Error) return e;
		throw e;
	}
}
