import { getCookie, toRequest } from "h3";
import type { H3Event } from "h3";

import { useDatabase } from "#db";
import { auth } from "./auth.js";
import { NoOrgSelectedError, NotOrgMemberError, UnauthorizedError } from "./errors.js";
import { getOrgMembership } from "./org.js";

type DB = ReturnType<typeof useDatabase>;

type RequireOrgOk = {
	session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
	orgId: string;
	db: DB;
	membership: NonNullable<Awaited<ReturnType<typeof getOrgMembership>>>;
};

export async function requireOrg(
	event: H3Event,
): Promise<UnauthorizedError | NoOrgSelectedError | NotOrgMemberError | Error | RequireOrgOk> {
	// auth.api.getSession throws better-auth APIError on failure; forward via Error union.
	const session = await auth.api
		.getSession({ headers: toRequest(event as any).headers })
		.catch((e: Error) => e);
	if (session instanceof Error) return session;
	if (!session) return new UnauthorizedError();

	const orgId = getCookie(event, "current_org_id");
	if (!orgId) return new NoOrgSelectedError();

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership) return new NotOrgMemberError();

	return { session, orgId, db, membership };
}
