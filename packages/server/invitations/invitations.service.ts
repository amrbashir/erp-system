import { lower } from "@workspace/db";
import { auditLogs, invitations, orgMembers, users } from "@workspace/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { DuplicateMemberError } from "../shared/errors.js";

type DB = PgDatabase<any, any>;
type Role = "owner" | "admin" | "member";
type Invitation = typeof invitations.$inferSelect;
type UserSummary = { id: string; name: string; email: string };

/**
 * Owns the `invitations` table + the post-signup consume hook.
 *
 * `consume` writes to `org_members` and `audit_logs` directly inside its
 * transaction — that's intentional: per-invite atomicity (membership +
 * audit + delete-invite or none) requires sharing the tx, and going
 * through MembersService/AuditService would force a parent-db write.
 */
export class InvitationsService {
	constructor(private readonly deps: { db: DB }) {}

	async list(orgId: string) {
		return this.deps.db
			.select({
				id: invitations.id,
				orgId: invitations.orgId,
				email: invitations.email,
				role: invitations.role,
				invitedBy: invitations.invitedBy,
				createdAt: invitations.createdAt,
				expiresAt: invitations.expiresAt,
			})
			.from(invitations)
			.where(and(eq(invitations.orgId, orgId), gt(invitations.expiresAt, sql`now()`)));
	}

	async send(input: {
		orgId: string;
		email: string;
		role: Role;
		invitedBy: string;
	}): Promise<DuplicateMemberError | Error | Invitation> {
		try {
			const [row] = await this.deps.db
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
			if (
				e?.code === "23505" ||
				e?.cause?.code === "23505" ||
				/unique/i.test(e?.message ?? "")
			) {
				return new DuplicateMemberError();
			}
			if (e instanceof Error) return e;
			throw e;
		}
	}

	async revoke(input: {
		orgId: string;
		invitationId: string;
	}): Promise<Error | Invitation | null> {
		try {
			const [deleted] = await this.deps.db
				.delete(invitations)
				.where(and(eq(invitations.id, input.invitationId), eq(invitations.orgId, input.orgId)))
				.returning();
			return deleted ?? null;
		} catch (e) {
			if (e instanceof Error) return e;
			throw e;
		}
	}

	async clearForEmail(input: { orgId: string; email: string }): Promise<void> {
		await this.deps.db
			.delete(invitations)
			.where(
				and(
					eq(invitations.orgId, input.orgId),
					eq(lower(invitations.email), input.email.toLowerCase()),
				),
			);
	}

	/**
	 * Called from auth.hooks.after on user.create — converts pending
	 * invitations for this email into memberships. Each invite runs in
	 * its own transaction so a single bad row can't strand the rest.
	 * Best-effort: errors are logged, never re-thrown (signup must
	 * succeed even if invite consumption partially fails).
	 */
	async consume(input: { userId: string; email: string }): Promise<void> {
		const pending = await this.deps.db
			.select({
				id: invitations.id,
				orgId: invitations.orgId,
				role: invitations.role,
			})
			.from(invitations)
			.where(
				and(
					eq(lower(invitations.email), input.email.toLowerCase()),
					gt(invitations.expiresAt, sql`now()`),
				),
			);

		if (pending.length === 0) return;

		for (const inv of pending) {
			try {
				await this.deps.db.transaction(async (tx) => {
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
					`[InvitationsService.consume] failed for invitation ${inv.id} (org ${inv.orgId}):`,
					e,
				);
			}
		}
	}

	async findUserByEmail(email: string): Promise<UserSummary | null> {
		const [row] = await this.deps.db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(eq(lower(users.email), email.toLowerCase()))
			.limit(1);
		return row ?? null;
	}
}
