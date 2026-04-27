import { defineEventHandler, HTTPError, getRouterParam } from "h3";

import { requireOrg } from "~/lib/require-org";
import { removeMember } from "~/lib/org-members";

export default defineEventHandler(async (event) => {
	const { orgId, db, membership } = await requireOrg(event);

	const memberId = getRouterParam(event, "id");
	if (!memberId) throw new HTTPError("Member ID required", { status: 400 });

	// prevent self-removal
	if (memberId === membership.id) {
		throw new HTTPError("Cannot remove yourself", { status: 400 });
	}

	try {
		await removeMember(db, {
			memberId,
			orgId,
			actorRole: membership.role as "owner" | "admin" | "member",
		});
		return { ok: true };
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
