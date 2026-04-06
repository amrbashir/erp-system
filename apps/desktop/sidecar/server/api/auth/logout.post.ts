import { defineEventHandler, getHeader, createError } from "nitro/h3";
import { useDatabase } from "../../utils/db";
import { deleteSession } from "../../lib/local-auth";

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
