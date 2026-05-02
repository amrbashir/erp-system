import { defineEventHandler, getRouterParam } from "h3";

import { logAudit } from "@workspace/server/lib/audit";
import { InvalidInputError, SelfRemovalError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { removeMember } from "@workspace/server/lib/org-members";
import { requireOrg } from "@workspace/server/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db, membership, session } = guard;

	const memberId = getRouterParam(event, "id");
	if (!memberId) throw toHTTPError(new InvalidInputError({ reason: "Member ID required" }));

	// prevent self-removal
	if (memberId === membership.id) {
		throw toHTTPError(new SelfRemovalError());
	}

	const result = await removeMember(db, {
		memberId,
		orgId,
		actorRole: membership.role as "owner" | "admin" | "member",
	});
	if (result instanceof Error) throw toHTTPError(result);

	await logAudit(db, {
		orgId,
		actorId: session.user.id,
		action: "member.remove",
		targetType: "member",
		targetId: memberId,
	});
	return { ok: true };
});
