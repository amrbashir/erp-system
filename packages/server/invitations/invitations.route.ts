import { authed, orgResolver } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { InvitationNotFoundError, NoPermissionError } from "../shared/errors.js";

const inv = authed.invitations.use(orgResolver);

/** Listing lives under `members.list`; sending under `members.add`. Only `revoke` is unique here. */
export const invitationsRouter = {
	revoke: inv.revoke.handler(async ({ context, input }) => {
		const actorRole = context.membership.role;
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
	}),
};
