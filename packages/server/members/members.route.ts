import { logAudit } from "../lib/audit.js";
import { authed, orgResolver } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { NoPermissionError, SelfRemovalError } from "../shared/errors.js";

// Every entry under `members` carries `{orgSlug}` - safe to apply `orgResolver` to the whole sub-router.
const m = authed.members.use(orgResolver);

/** Audit writes at procedure boundary; service tier is single-table by design. */
export const membersRouter = {
	/** Combined snapshot for the UI table in one pass. */
	list: m.list.handler(async ({ context }) => {
		const [members, invitations] = await Promise.all([
			context.membersService.list(context.orgId),
			context.invitationsService.list(context.orgId),
		]);
		return {
			members: members.map((m) => ({ kind: "member" as const, ...m })),
			invitations: invitations.map((i) => ({ kind: "invitation" as const, ...i })),
		};
	}),

	/** Existing user -> membership + clear stale invites. Unknown email -> pending invitation, consumed on signup. */
	add: m.add.handler(async ({ context, input }) => {
		const actorRole = context.membership.role;
		if (actorRole === "member") {
			throw new NoPermissionError({ reason: "No permission to add members" });
		}
		if (actorRole === "admin" && input.role !== "member") {
			throw new NoPermissionError({ reason: "Admins can only add members" });
		}

		const existing = await context.invitationsService.findUserByEmail(input.email);
		if (existing) {
			const member = unwrap(
				await context.membersService.add({
					orgId: context.orgId,
					userId: existing.id,
					role: input.role,
				}),
			);
			await context.invitationsService.clearForEmail({
				orgId: context.orgId,
				email: input.email,
			});
			await logAudit(context.db, {
				orgId: context.orgId,
				actorId: context.session.user.id,
				action: "member.add",
				targetType: "member",
				targetId: member.id,
				metadata: { role: input.role, email: input.email },
			});
			return;
		}

		const invitation = unwrap(
			await context.invitationsService.send({
				orgId: context.orgId,
				email: input.email,
				role: input.role,
				invitedBy: context.session.user.id,
			}),
		);
		await logAudit(context.db, {
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "invitation.send",
			targetType: "invitation",
			targetId: invitation.id,
			metadata: { role: input.role, email: input.email },
		});
	}),

	updateRole: m.updateRole.handler(async ({ context, input }) => {
		unwrap(
			await context.membersService.updateRole({
				memberId: input.memberId,
				orgId: context.orgId,
				actorRole: context.membership.role,
				newRole: input.role,
				actorMemberId: context.membership.id,
			}),
		);
		await logAudit(context.db, {
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "member.role_update",
			targetType: "member",
			targetId: input.memberId,
			metadata: { newRole: input.role },
		});
	}),

	remove: m.remove.handler(async ({ context, input }) => {
		if (input.memberId === context.membership.id) throw new SelfRemovalError();

		unwrap(
			await context.membersService.remove({
				memberId: input.memberId,
				orgId: context.orgId,
				actorRole: context.membership.role,
			}),
		);
		await logAudit(context.db, {
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "member.remove",
			targetType: "member",
			targetId: input.memberId,
		});
	}),

	transferOwnership: m.transferOwnership.handler(async ({ context, input }) => {
		if (context.membership.role !== "owner") {
			throw new NoPermissionError({ reason: "Only owners can transfer ownership" });
		}

		unwrap(
			await context.membersService.transferOwnership({
				orgId: context.orgId,
				actorMemberId: context.membership.id,
				targetMemberId: input.targetMemberId,
				newActorRole: input.newActorRole,
			}),
		);
		await logAudit(context.db, {
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "member.transfer_ownership",
			targetType: "member",
			targetId: input.targetMemberId,
			metadata: { newActorRole: input.newActorRole },
		});
	}),
};
