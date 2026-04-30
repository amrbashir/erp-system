import { createError, defineEventHandler } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { getUserOrgs } from "~/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({ headers: event.req.headers }).catch(() => null);
	if (!session) throw createError({ statusCode: 401, statusMessage: "Not authenticated" });

	const db = useDatabase();
	const orgs = await getUserOrgs(db, session.user.id);

	return {
		user: {
			id: session.user.id,
			name: session.user.name,
			username: (session.user as { username?: string }).username ?? "",
		},
		orgs,
	};
});
