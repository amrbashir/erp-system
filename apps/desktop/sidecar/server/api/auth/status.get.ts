import { defineEventHandler, getHeader } from "nitro/h3";

import { isSetupComplete, getSessionByToken } from "../../lib/local-auth";
import { useDatabase } from "../../utils/db";

export default defineEventHandler(async (event) => {
	const db = useDatabase();
	const setupComplete = await isSetupComplete(db);

	let loggedIn = false;
	let user = null;

	const authHeader = getHeader(event, "authorization");
	const token = authHeader?.replace(/^Bearer\s+/, "");
	if (token) {
		const result = await getSessionByToken(db, token);
		if (result) {
			loggedIn = true;
			user = { id: result.user.id, name: result.user.name, username: result.user.username };
		}
	}

	return { setupComplete, loggedIn, user };
});
