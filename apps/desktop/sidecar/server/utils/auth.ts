import type { H3Event } from "nitro/h3";
import { getHeader, createError } from "nitro/h3";

import { getSessionByToken } from "../lib/local-auth";
import { useDatabase } from "./db";

export async function requireSession(event: H3Event) {
	const authHeader = getHeader(event, "authorization");
	const token = authHeader?.replace(/^Bearer\s+/, "");

	if (!token) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	const db = useDatabase();
	const result = await getSessionByToken(db, token);

	if (!result) {
		throw createError({ statusCode: 401, message: "Unauthorized" });
	}

	return result;
}
