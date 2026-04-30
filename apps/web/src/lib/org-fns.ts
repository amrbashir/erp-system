import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@workspace/server/lib/auth";
import { UnauthorizedError } from "@workspace/server/lib/errors";
import { getUserOrgs } from "@workspace/server/lib/org";

import { useDatabase } from "#db";

const CURRENT_ORG_COOKIE = "current_org_id";

export const getOrgs = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest();
	// auth.api.getSession throws better-auth APIError on failure; treat as unauthorized.
	const session = await auth.api
		.getSession({ headers: request.headers })
		.catch((e: Error) => e);
	if (session instanceof Error || !session) throw new UnauthorizedError();
	const db = useDatabase();
	return getUserOrgs(db, session.user.id);
});

export const getCurrentOrgId = createServerFn({ method: "GET" }).handler(async () => {
	const request = getRequest();
	const cookies = request.headers.get("cookie") ?? "";
	const match = cookies
		.split(";")
		.map((c) => c.trim())
		.find((c) => c.startsWith(`${CURRENT_ORG_COOKIE}=`));
	return match ? match.split("=")[1] : null;
});
