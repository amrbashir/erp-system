import { eq, and } from "drizzle-orm";
import { orgMembers, users } from "@workspace/db/schema";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as schema from "@workspace/db/schema";

type DB = NeonHttpDatabase<typeof schema>;
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

export async function addMemberToOrg(
	db: DB,
	input: { orgId: string; userId: string; role: Role },
) {
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

export async function updateMemberRole(
	db: DB,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
		newRole: Role;
	},
) {
	// permission checks
	if (input.actorRole === "member") {
		throw new Error("No permission to change roles");
	}
	if (input.actorRole === "admin" && input.newRole !== "member") {
		throw new Error("No permission to assign this role");
	}

	const [updated] = await db
		.update(orgMembers)
		.set({ role: input.newRole })
		.where(
			and(
				eq(orgMembers.id, input.memberId),
				eq(orgMembers.orgId, input.orgId),
			),
		)
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

	// admin can only remove members, not owners/admins
	if (input.actorRole === "admin") {
		const [target] = await db
			.select({ role: orgMembers.role })
			.from(orgMembers)
			.where(
				and(
					eq(orgMembers.id, input.memberId),
					eq(orgMembers.orgId, input.orgId),
				),
			)
			.limit(1);

		if (!target) throw new Error("Member not found");
		if (target.role !== "member") {
			throw new Error("No permission to remove this member");
		}
	}

	const [deleted] = await db
		.delete(orgMembers)
		.where(
			and(
				eq(orgMembers.id, input.memberId),
				eq(orgMembers.orgId, input.orgId),
			),
		)
		.returning();

	if (!deleted) throw new Error("Member not found");
	return deleted;
}
