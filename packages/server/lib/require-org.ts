import { HTTPError, getCookie, toRequest } from "h3";
import type { H3Event } from "h3";

import { useDatabase } from "#db";
import { auth } from "./auth.js";
import { getOrgMembership } from "./org.js";

export async function requireOrg(event: H3Event) {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw new HTTPError("Unauthorized", { status: 401 });

	const orgId = getCookie(event, "current_org_id");
	if (!orgId) throw new HTTPError("No org selected", { status: 400 });

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership) throw new HTTPError("Not a member of this org", { status: 403 });

	return { session, orgId, db, membership };
}
