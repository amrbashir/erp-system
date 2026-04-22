import { defineEventHandler, readBody, setCookie, toRequest, HTTPError } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { orgSwitchCookieOptions } from "~/lib/cookie";
import { getOrgMembership } from "~/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw new HTTPError("Unauthorized", { status: 401 });

	const body = await readBody<{ orgId: string }>(event);
	if (!body?.orgId) {
		throw new HTTPError("orgId required", { status: 400 });
	}

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, body.orgId);
	if (!membership) {
		throw new HTTPError("Not a member of this org", { status: 403 });
	}

	setCookie(event, "current_org_id", body.orgId, orgSwitchCookieOptions());

	return { orgId: body.orgId };
});
