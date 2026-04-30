import { defineEventHandler } from "h3";

import { auth } from "~/lib/auth";

export default defineEventHandler(async (event) => {
	await auth.api.signOut({ headers: event.req.headers }).catch(() => {});
	return { ok: true };
});
