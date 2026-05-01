import { lower } from "@workspace/db";
import { auditLogs, invitations, orgMembers, users } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { DuplicateMemberError } from "./errors.js";

type DB = PgDatabase<any, any>;
type Role = "owner" | "admin" | "member";
type Invitation = typeof invitations.$inferSelect;

/**
 * Create an invitation for an email that doesn't have an account yet.
 * Caller is responsible for the "user already exists → add to org directly"
 * branch; this function only handles the pending case.
 */
export async function sendInvitation(
	db: DB,
	input: { orgId: string; email: string; role: Role; invitedBy: string },
): Promise<DuplicateMemberError | Error | Invitation> {
	try {
		const [row] = await db
			.insert(invitations)
			.values({
				orgId: input.orgId,
				email: input.email,
				role: input.role,
				invitedBy: input.invitedBy,
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

export async function listInvitations(db: DB, orgId: string) {
	return db
		.select({
			id: invitations.id,
			orgId: invitations.orgId,
			email: invitations.email,
			role: invitations.role,
			invitedBy: invitations.invitedBy,
			createdAt: invitations.createdAt,
		})
		.from(invitations)
		.where(eq(invitations.orgId, orgId));
}

export async function revokeInvitation(
	db: DB,
	input: { orgId: string; invitationId: string },
): Promise<Error | Invitation | null> {
	try {
		const [deleted] = await db
			.delete(invitations)
			.where(
				and(eq(invitations.id, input.invitationId), eq(invitations.orgId, input.orgId)),
			)
			.returning();
		return deleted ?? null;
	} catch (e) {
		if (e instanceof Error) return e;
		throw e;
	}
}

/**
 * Clear any pending invitations for this email/org pair.
 * Called when adding an existing user directly to an org so we don't
 * leave orphan invitations for the same email.
 */
export async function clearInvitationsForEmail(
	db: DB,
	input: { orgId: string; email: string },
) {
	await db
		.delete(invitations)
		.where(
			and(
				eq(invitations.orgId, input.orgId),
				eq(lower(invitations.email), input.email.toLowerCase()),
			),
		);
}

/**
 * Called from auth hooks.after on user.create — looks up any pending
 * invitations for this user's email and converts each into an org membership.
 * Best-effort: errors don't roll back signup.
 *
 * Each invite is processed in its own transaction so:
 *  - partial state per invite is impossible (member+audit+delete or none)
 *  - one bad invite (e.g. cascade race) doesn't strand the rest
 */
export async function consumeInvitations(
	db: DB,
	input: { userId: string; email: string },
): Promise<void> {
	const pending = await db
		.select({
			id: invitations.id,
			orgId: invitations.orgId,
			role: invitations.role,
		})
		.from(invitations)
		.where(eq(lower(invitations.email), input.email.toLowerCase()));

	if (pending.length === 0) return;

	for (const inv of pending) {
		try {
			await db.transaction(async (tx) => {
				// onConflictDoNothing in case the user is somehow already a member
				await tx
					.insert(orgMembers)
					.values({ orgId: inv.orgId, userId: input.userId, role: inv.role })
					.onConflictDoNothing();
				await tx.insert(auditLogs).values({
					orgId: inv.orgId,
					actorId: input.userId,
					action: "invitation.consume",
					targetType: "invitation",
					targetId: inv.id,
					metadata: { email: input.email, role: inv.role },
				});
				await tx.delete(invitations).where(eq(invitations.id, inv.id));
			});
		} catch (e) {
			console.error(
				`[consumeInvitations] failed for invitation ${inv.id} (org ${inv.orgId}):`,
				e,
			);
		}
	}
}

/**
 * Find existing user by email (case-insensitive). Used by the invite-or-add flow.
 */
export async function findUserByEmail(db: DB, email: string) {
	const [row] = await db
		.select({ id: users.id, name: users.name, email: users.email })
		.from(users)
		.where(eq(lower(users.email), email.toLowerCase()))
		.limit(1);
	return row ?? null;
}

