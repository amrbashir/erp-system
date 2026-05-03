import { defineEventHandler, getRouterParam } from "h3";

import { logAudit } from "@workspace/server/lib/audit";
import { InvalidInputError, InvitationNotFoundError, NoPermissionError } from "@workspace/server/shared/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { revokeInvitation } from "@workspace/server/lib/invitations";
import { requireOrg } from "@workspace/server/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db, membership, session } = guard;

	const actorRole = membership.role as "owner" | "admin" | "member";
	if (actorRole === "member") {
		throw toHTTPError(new NoPermissionError({ reason: "No permission to revoke invitations" }));
	}

	const invitationId = getRouterParam(event, "id");
	if (!invitationId) {
		throw toHTTPError(new InvalidInputError({ reason: "Invitation ID required" }));
	}

	const result = await revokeInvitation(db, { orgId, invitationId });
	if (result instanceof Error) throw toHTTPError(result);
	if (!result) throw toHTTPError(new InvitationNotFoundError());

	await logAudit(db, {
		orgId,
		actorId: session.user.id,
		action: "invitation.revoke",
		targetType: "invitation",
		targetId: invitationId,
		metadata: { email: result.email, role: result.role },
	});
	return { ok: true };
});
