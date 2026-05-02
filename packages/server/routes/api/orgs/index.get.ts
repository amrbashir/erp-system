import { defineEventHandler, toRequest } from "h3";

import { useDatabase } from "#db";
import { auth } from "@workspace/server/lib/auth";
import { UnauthorizedError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { getUserOrgs } from "@workspace/server/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api
		.getSession({ headers: toRequest(event as any).headers })
		.catch((e: Error) => e);
	if (session instanceof Error) throw toHTTPError(session);
	if (!session) throw toHTTPError(new UnauthorizedError());

	const db = useDatabase();
	return getUserOrgs(db, session.user.id);
});
