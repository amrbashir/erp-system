import { defineEventHandler, readBody, setCookie, toRequest, createError } from "h3";

import { auth } from "~/lib/auth";
import { useDatabase } from "#db";
import { getOrgMembership } from "~/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw createError({ statusCode: 401, message: "Unauthorized" });

	const body = await readBody<{ orgId: string }>(event);
	if (!body?.orgId) {
		throw createError({ statusCode: 400, message: "orgId required" });
	}

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, body.orgId);
	if (!membership) {
		throw createError({ statusCode: 403, message: "Not a member of this org" });
	}

	setCookie(event, "current_org_id", body.orgId, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	});

	return { orgId: body.orgId };
});
