import { orgMembers, roleEnum, users } from "@workspace/db/schema";
import { and, count, eq } from "drizzle-orm";

import type { DB } from "../shared/db.js";
import {
	DuplicateMemberError,
	isPgUniqueViolation,
	LastOwnerError,
	MemberNotFoundError,
	NoPermissionError,
	SelfRoleChangeError,
	SelfTransferError,
	TargetMemberNotFoundError,
} from "../shared/errors.js";
type Role = (typeof roleEnum.enumValues)[number];
type OrgMember = typeof orgMembers.$inferSelect;

/** "Add by email" coordination (user vs invite) lives in the route. Last-owner checks run inside transactions so concurrent demotions can't strand an org. */
export class MembersService {
	constructor(private readonly deps: { db: DB }) {}

	async list(orgId: string) {
		return this.deps.db
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

	async add(input: {
		orgId: string;
		userId: string;
		role: Role;
	}): Promise<DuplicateMemberError | Error | OrgMember> {
		try {
			const [row] = await this.deps.db
				.insert(orgMembers)
				.values({
					orgId: input.orgId,
					userId: input.userId,
					role: input.role,
				})
				.returning();
			return row;
		} catch (e) {
			if (isPgUniqueViolation(e)) return new DuplicateMemberError();
			if (e instanceof Error) return e;
			throw e;
		}
	}

	async updateRole(input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
		newRole: Role;
		actorMemberId?: string;
	}): Promise<
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

		if (input.actorMemberId && input.actorMemberId === input.memberId) {
			return new SelfRoleChangeError();
		}

		try {
			return await this.deps.db.transaction(async (tx) => {
				const [target] = await tx
					.select({ role: orgMembers.role })
					.from(orgMembers)
					.where(
						and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)),
					)
					.limit(1);

				if (input.actorRole === "admin") {
					if (!target) throw new MemberNotFoundError();
					if (target.role !== "member") {
						throw new NoPermissionError({
							reason: "No permission to change this member's role",
						});
					}
				}

				if (input.newRole !== "owner" && target?.role === "owner") {
					const ownerCount = await countOwners(tx, input.orgId);
					if (ownerCount <= 1) {
						throw new LastOwnerError({ action: "demote" });
					}
				}

				const [updated] = await tx
					.update(orgMembers)
					.set({ role: input.newRole })
					.where(
						and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)),
					)
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

	async remove(input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
	}): Promise<NoPermissionError | MemberNotFoundError | LastOwnerError | Error | OrgMember> {
		if (input.actorRole === "member") {
			return new NoPermissionError({ reason: "No permission to remove members" });
		}

		try {
			return await this.deps.db.transaction(async (tx) => {
				const [target] = await tx
					.select({ role: orgMembers.role })
					.from(orgMembers)
					.where(
						and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)),
					)
					.limit(1);

				if (input.actorRole === "admin") {
					if (!target) throw new MemberNotFoundError();
					if (target.role !== "member") {
						throw new NoPermissionError({
							reason: "No permission to remove this member",
						});
					}
				}

				if (target?.role === "owner") {
					const ownerCount = await countOwners(tx, input.orgId);
					if (ownerCount <= 1) {
						throw new LastOwnerError({ action: "remove" });
					}
				}

				const [deleted] = await tx
					.delete(orgMembers)
					.where(
						and(eq(orgMembers.id, input.memberId), eq(orgMembers.orgId, input.orgId)),
					)
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

	async transferOwnership(input: {
		orgId: string;
		actorMemberId: string;
		targetMemberId: string;
		newActorRole: "admin" | "member";
	}): Promise<
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
			return await this.deps.db.transaction(async (tx) => {
				const [actor] = await tx
					.select({ role: orgMembers.role })
					.from(orgMembers)
					.where(
						and(
							eq(orgMembers.id, input.actorMemberId),
							eq(orgMembers.orgId, input.orgId),
						),
					)
					.limit(1);

				if (!actor || actor.role !== "owner") {
					throw new NoPermissionError({ reason: "Only owners can transfer ownership" });
				}

				const [target] = await tx
					.select({ role: orgMembers.role })
					.from(orgMembers)
					.where(
						and(
							eq(orgMembers.id, input.targetMemberId),
							eq(orgMembers.orgId, input.orgId),
						),
					)
					.limit(1);

				if (!target) {
					throw new TargetMemberNotFoundError();
				}

				const [updatedTarget] = await tx
					.update(orgMembers)
					.set({ role: "owner" })
					.where(
						and(
							eq(orgMembers.id, input.targetMemberId),
							eq(orgMembers.orgId, input.orgId),
						),
					)
					.returning();

				const [updatedActor] = await tx
					.update(orgMembers)
					.set({ role: input.newActorRole })
					.where(
						and(
							eq(orgMembers.id, input.actorMemberId),
							eq(orgMembers.orgId, input.orgId),
						),
					)
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
}

async function countOwners(db: DB, orgId: string): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(orgMembers)
		.where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "owner")));
	return result?.count ?? 0;
}
