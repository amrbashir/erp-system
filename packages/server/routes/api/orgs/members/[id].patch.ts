import { defineEventHandler, readBody, getRouterParam } from "h3";

import { logAudit } from "@workspace/server/lib/audit";
import { InvalidInputError } from "@workspace/server/shared/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { updateMemberRole } from "@workspace/server/lib/org-members";
import { requireOrg } from "@workspace/server/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db, membership, session } = guard;

	const memberId = getRouterParam(event, "id");
	if (!memberId) throw toHTTPError(new InvalidInputError({ reason: "Member ID required" }));

	const body = await readBody<{ role: "owner" | "admin" | "member" }>(event);
	if (!body?.role) {
		throw toHTTPError(new InvalidInputError({ reason: "role required" }));
	}

	const updated = await updateMemberRole(db, {
		memberId,
		orgId,
		actorRole: membership.role as "owner" | "admin" | "member",
		newRole: body.role,
		actorMemberId: membership.id,
	});
	if (updated instanceof Error) throw toHTTPError(updated);

	await logAudit(db, {
		orgId,
		actorId: session.user.id,
		action: "member.role_update",
		targetType: "member",
		targetId: memberId,
		metadata: { newRole: body.role },
	});
	return updated;
});
