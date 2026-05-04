import * as z from "zod";

import { orgScoped } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { InvitationNotFoundError, NoPermissionError } from "../shared/errors.js";

const revokeInput = z.object({
	invitationId: z.uuid(),
});

/**
 * Invitation procedures. Listing lives under `members.list` (combined
 * snapshot for the UI). Sending invites is part of the `members.add`
 * branch flow. Only `revoke` is unique to this surface.
 */
export const invitationsRouter = {
	revoke: orgScoped.input(revokeInput).handler(async ({ context, input }) => {
		const actorRole = context.membership.role as "owner" | "admin" | "member";
		if (actorRole === "member") {
			throw new NoPermissionError({ reason: "No permission to revoke invitations" });
		}

		const result = unwrap(
			await context.invitationsService.revoke({
				orgId: context.orgId,
				invitationId: input.invitationId,
			}),
		);
		if (!result) throw new InvitationNotFoundError();

		await context.auditService.log({
			orgId: context.orgId,
			actorId: context.session.user.id,
			action: "invitation.revoke",
			targetType: "invitation",
			targetId: input.invitationId,
			metadata: { email: result.email, role: result.role },
		});
		return { ok: true as const };
	}),
};
