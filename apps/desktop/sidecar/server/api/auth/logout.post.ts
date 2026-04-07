import { defineEventHandler, getHeader, createError } from "nitro/h3";

import { deleteSession } from "../../lib/local-auth";
import { useDatabase } from "../../utils/db";

export default defineEventHandler(async (event) => {
	const authHeader = getHeader(event, "authorization");
	const token = authHeader?.replace(/^Bearer\s+/, "");

	if (!token) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const db = useDatabase();
	await deleteSession(db, token);

	return { ok: true };
});
