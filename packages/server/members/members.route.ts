import * as z from "zod";

import { orgScoped } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { NoPermissionError, SelfRemovalError } from "../shared/errors.js";

const roleEnum = z.enum(["owner", "admin", "member"]);

const addInput = z.object({
	email: z.email(),
	role: roleEnum,
});

const updateRoleInput = z.object({
	memberId: z.uuid(),
	role: roleEnum,
});

const removeInput = z.object({
	memberId: z.uuid(),
});

const transferInput = z.object({
	targetMemberId: z.uuid(),
	newActorRole: z.enum(["admin", "member"]),
});

/**
 * Members procedures. All `orgScoped`, so context has `orgId`, `membership`,
 * `session`. Audit writes happen at the procedure boundary — the service
 * tier is single-table by design.
 */
export const membersRouter = {
	/** Combined snapshot the UI table renders in one pass. */
	list: orgScoped.handler(async ({ context }) => {
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
	add: orgScoped.input(addInput).handler(async ({ context, input }) => {
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
			return { kind: "member" as const, member };
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
		return { kind: "invitation" as const, invitation };
	}),

	updateRole: orgScoped.input(updateRoleInput).handler(async ({ context, input }) => {
		const updated = unwrap(
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
		return updated;
	}),

	remove: orgScoped.input(removeInput).handler(async ({ context, input }) => {
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
		return { ok: true as const };
	}),

	transferOwnership: orgScoped.input(transferInput).handler(async ({ context, input }) => {
		if (context.membership.role !== "owner") {
			throw new NoPermissionError({ reason: "Only owners can transfer ownership" });
		}

		const result = unwrap(
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
		return result;
	}),
};
