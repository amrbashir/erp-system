import { users } from "@workspace/db/schema";
import { defineEventHandler } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
	const db = useDatabase();

	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	const setupComplete = !!existing;

	const session = await auth.api.getSession({ headers: event.req.headers }).catch(() => null);
	const loggedIn = !!session;

	return {
		setupComplete,
		loggedIn,
		user: session
			? {
					id: session.user.id,
					name: session.user.name,
					username: (session.user as { username?: string }).username ?? "",
				}
			: null,
	};
});
