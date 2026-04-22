import { defineEventHandler, toRequest, HTTPError, getCookie, getRouterParam } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { getOrgMembership } from "~/lib/org";
import { removeMember } from "~/lib/org-members";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw new HTTPError("Unauthorized", { status: 401 });

	const orgId = getCookie(event, "current_org_id");
	if (!orgId) throw new HTTPError("No org selected", { status: 400 });

	const memberId = getRouterParam(event, "id");
	if (!memberId) throw new HTTPError("Member ID required", { status: 400 });

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership)
		throw new HTTPError("Not a member of this org", {
			status: 403,
		});

	// prevent self-removal
	if (memberId === membership.id) {
		throw new HTTPError("Cannot remove yourself", {
			status: 400,
		});
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
		if (e.message === "Member not found") {
			throw new HTTPError(e.message, { status: 404 });
		}
		throw e;
	}
});
