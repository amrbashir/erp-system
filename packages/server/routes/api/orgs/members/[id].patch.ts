import { defineEventHandler, readBody, toRequest, HTTPError, getCookie, getRouterParam } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { getOrgMembership } from "~/lib/org";
import { updateMemberRole } from "~/lib/org-members";

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
