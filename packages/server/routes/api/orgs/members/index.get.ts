import { defineEventHandler, toRequest, createError, getCookie } from "h3";

import { auth } from "#auth";
import { useDatabase } from "#db";
import { getOrgMembership } from "@/lib/org";
import { getOrgMembers } from "@/lib/org-members";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw createError({ statusCode: 401, message: "Unauthorized" });

	const orgId = getCookie(event, "current_org_id");
	if (!orgId) throw createError({ statusCode: 400, message: "No org selected" });

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership)
		throw createError({
			statusCode: 403,
			message: "Not a member of this org",
		});

	return getOrgMembers(db, orgId);
});
