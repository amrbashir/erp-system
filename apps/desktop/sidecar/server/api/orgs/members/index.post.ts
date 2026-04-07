import { orgMembers } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { defineEventHandler, readBody, createError, getQuery } from "nitro/h3";

import { createLocalUser } from "../../../lib/local-auth";
import { requireSession } from "../../../utils/auth";
import { useDatabase } from "../../../utils/db";

export default defineEventHandler(async (event) => {
	const { user } = await requireSession(event);
	const db = useDatabase();

	const query = getQuery(event);
	const orgId = query.orgId as string;
	if (!orgId) {
		throw createError({ statusCode: 400, message: "orgId required" });
	}

	const [membership] = await db
		.select()
		.from(orgMembers)
		.where(and(eq(orgMembers.userId, user.id), eq(orgMembers.orgId, orgId)))
		.limit(1);

	if (!membership) {
		throw createError({ statusCode: 403, message: "Not a member of this org" });
	}

	const actorRole = membership.role as "owner" | "admin" | "member";

	const body = await readBody<{
		username: string;
		password: string;
		name: string;
		role: "owner" | "admin" | "member";
	}>(event);

	if (!body?.username || !body?.password || !body?.name || !body?.role) {
		throw createError({
			statusCode: 400,
			message: "username, password, name, and role required",
		});
	}

	try {
		const result = await createLocalUser(db, {
			orgId,
			username: body.username,
			password: body.password,
			name: body.name,
			role: body.role,
			actorRole,
		});

		return {
			id: result.membership.id,
			userId: result.user.id,
			role: result.membership.role,
			userName: result.user.name,
			username: result.user.username,
		};
	} catch (e: any) {
		if (e.message?.includes("No permission")) {
			throw createError({ statusCode: 403, message: e.message });
		}
		if (e.message?.includes("already exists")) {
			throw createError({ statusCode: 409, message: e.message });
		}
		throw e;
	}
});
