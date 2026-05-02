import { defineEventHandler, readBody, setCookie, toRequest } from "h3";

import { useDatabase } from "#db";
import { auth } from "@workspace/server/lib/auth";
import { orgSwitchCookieOptions } from "@workspace/server/lib/cookie";
import { InvalidInputError, NotOrgMemberError, UnauthorizedError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { getOrgMembership } from "@workspace/server/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api
		.getSession({ headers: toRequest(event as any).headers })
		.catch((e: Error) => e);
	if (session instanceof Error) throw toHTTPError(session);
	if (!session) throw toHTTPError(new UnauthorizedError());

	const body = await readBody<{ orgId: string }>(event);
	if (!body?.orgId) {
		throw toHTTPError(new InvalidInputError({ reason: "orgId required" }));
	}

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, body.orgId);
	if (!membership) {
		throw toHTTPError(new NotOrgMemberError());
	}

	setCookie(event, "current_org_id", body.orgId, orgSwitchCookieOptions());

	return { orgId: body.orgId };
});
