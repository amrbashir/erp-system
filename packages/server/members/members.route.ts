import { authed, orgResolver } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { NoPermissionError, SelfRemovalError } from "../shared/errors.js";

// Every entry under `members` carries `{orgSlug}` in the contract input,
// so applying `orgResolver` to the whole sub-router is safe and uniform.
const m = authed.members.use(orgResolver);

/**
 * Members procedures. Org-scoped — context has `orgId`, `membership`,
 * `session`. Audit writes happen at the procedure boundary; the service
 * tier is single-table by design.
 */
export const membersRouter = {
	/** Combined snapshot the UI table renders in one pass. */
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

	/**
	 * "Add user by email" — branches on whether the email is registered:
	 *  - existing user → membership row + clear stale invites
	 *  - unknown email → pending invitation, consumed on signup
	 */
	add: m.add.handler(async ({ context, input }) => {
		const actorRole = context.membership.role as "owner" | "admin" | "member";
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
			await context.auditService.log({
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
		await context.auditService.log({
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
				actorRole: context.membership.role as "owner" | "admin" | "member",
				newRole: input.role,
				actorMemberId: context.membership.id,
			}),
		);
		await context.auditService.log({
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "member.role_update",
			targetType: "member",
			targetId: input.memberId,
			metadata: { newRole: input.role },
		});
	}),

	remove: m.remove.handler(async ({ context, input }) => {
		// self-removal blocked at procedure level (uses session/membership)
		if (input.memberId === context.membership.id) throw new SelfRemovalError();

		unwrap(
			await context.membersService.remove({
				memberId: input.memberId,
				orgId: context.orgId,
				actorRole: context.membership.role as "owner" | "admin" | "member",
			}),
		);
		await context.auditService.log({
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
		await context.auditService.log({
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "member.transfer_ownership",
			targetType: "member",
			targetId: input.targetMemberId,
			metadata: { newActorRole: input.newActorRole },
		});
	}),
};
