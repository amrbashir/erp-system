import { defineEventHandler, readBody, toRequest, createError } from "h3";

import { auth } from "@/lib/auth";
import { useDatabase } from "#db";
import { createOrg } from "@/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw createError({ statusCode: 401, message: "Unauthorized" });

	const body = await readBody<{ name: string; slug: string; currency?: string }>(event);
	if (!body?.name || !body?.slug) {
		throw createError({ statusCode: 400, message: "name and slug required" });
	}

	const db = useDatabase();
	const org = await createOrg(db, {
		name: body.name,
		slug: body.slug,
		userId: session.user.id,
		currency: body.currency,
	});

	return org;
});
