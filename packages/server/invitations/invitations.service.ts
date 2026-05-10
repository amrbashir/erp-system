import { invitations, lower, orgMembers, roleEnum, users } from "@workspace/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

import { logAudit } from "../lib/audit.js";
import type { DB } from "../shared/db.js";
import { DuplicateMemberError, isPgUniqueViolation } from "../shared/errors.js";
type Role = (typeof roleEnum.enumValues)[number];
type Invitation = typeof invitations.$inferSelect;
type UserSummary = Pick<typeof users.$inferSelect, "id" | "name" | "email">;

/** `consume` writes to `org_members` directly and audits via the same tx - per-invite atomicity needs all three writes in one transaction. */
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
		} catch (e) {
			if (isPgUniqueViolation(e)) return new DuplicateMemberError();
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

	/** Called from auth.hooks.after on user.create. Per-invite tx so one bad row doesn't strand the rest. Best-effort: signup must succeed even if consumption partially fails. */
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
					await logAudit(tx, {
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
