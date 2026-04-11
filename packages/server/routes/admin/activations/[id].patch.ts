import { defineEventHandler, readBody, toRequest, createError, getRouterParam } from "h3";

import { auth } from "#auth";
import { useDatabase } from "#db";

import { toggleActivationStatus } from "@/lib/activation";
import { assertAdmin } from "@/lib/admin";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	assertAdmin(session);

	const id = getRouterParam(event, "id");
	if (!id) throw createError({ statusCode: 400, message: "id is required" });

	const body = await readBody<{ status?: string }>(event);
	if (!body?.status || !["active", "revoked"].includes(body.status)) {
		throw createError({ statusCode: 400, message: "status must be 'active' or 'revoked'" });
	}

	const db = useDatabase();

	try {
		return await toggleActivationStatus(db, id, body.status as "active" | "revoked");
	} catch {
		throw createError({ statusCode: 404, message: "activation not found" });
	}
});
