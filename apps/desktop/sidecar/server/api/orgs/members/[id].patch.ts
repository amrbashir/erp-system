import { orgMembers } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { defineEventHandler, readBody, createError, getQuery, getRouterParam } from "nitro/h3";

import { updateLocalMemberRole } from "../../../lib/local-auth";
import { requireSession } from "../../../utils/auth";
import { useDatabase } from "../../../utils/db";

export default defineEventHandler(async (event) => {
	const { user } = await requireSession(event);
	const db = useDatabase();

	const memberId = getRouterParam(event, "id");
	if (!memberId) {
		throw createError({ statusCode: 400, message: "member id required" });
	}

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

	const body = await readBody<{ role: "owner" | "admin" | "member" }>(event);
	if (!body?.role) {
		throw createError({ statusCode: 400, message: "role required" });
	}

	try {
		const updated = await updateLocalMemberRole(db, {
			memberId,
			orgId,
			actorRole: membership.role as "owner" | "admin" | "member",
			newRole: body.role,
		});
		return updated;
	} catch (e: any) {
		if (e.message?.includes("No permission")) {
			throw createError({ statusCode: 403, message: e.message });
		}
		throw e;
	}
});
