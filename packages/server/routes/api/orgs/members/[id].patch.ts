import { defineEventHandler, readBody, HTTPError, getRouterParam } from "h3";

import { requireOrg } from "~/lib/require-org";
import { updateMemberRole } from "~/lib/org-members";

export default defineEventHandler(async (event) => {
	const { orgId, db, membership } = await requireOrg(event);

	const memberId = getRouterParam(event, "id");
	if (!memberId) throw new HTTPError("Member ID required", { status: 400 });

	const body = await readBody<{ role: "owner" | "admin" | "member" }>(event);
	if (!body?.role) {
		throw new HTTPError("role required", { status: 400 });
	}

	try {
		const updated = await updateMemberRole(db, {
			memberId,
			orgId,
			actorRole: membership.role as "owner" | "admin" | "member",
			newRole: body.role,
			actorMemberId: membership.id,
		});
		return updated;
	} catch (e: any) {
		if (e.message?.includes("permission")) {
			throw new HTTPError(e.message, { status: 403 });
		}
		if (e.message?.includes("Cannot")) {
			throw new HTTPError(e.message, { status: 403 });
		}
		if (e.message === "Member not found") {
			throw new HTTPError(e.message, { status: 404 });
		}
		throw e;
	}
});
