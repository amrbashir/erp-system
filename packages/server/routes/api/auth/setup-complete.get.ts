import { users } from "@workspace/db/schema";
import { defineEventHandler } from "h3";

import { useDatabase } from "#db";

/**
 * Tiny probe for the desktop bootstrap: returns whether any user exists.
 * Lets the client decide between desktop-onboarding vs. login.
 */
export default defineEventHandler(async () => {
	const db = useDatabase();
	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	return { setupComplete: !!existing };
});
