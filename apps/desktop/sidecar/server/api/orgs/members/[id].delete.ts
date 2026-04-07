import { orgMembers } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { defineEventHandler, createError, getQuery, getRouterParam } from "nitro/h3";

import { removeLocalMember } from "../../../lib/local-auth";
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

	// prevent self-removal
	const [target] = await db
		.select()
		.from(orgMembers)
		.where(and(eq(orgMembers.id, memberId), eq(orgMembers.orgId, orgId)))
		.limit(1);

	if (target && target.userId === user.id) {
		throw createError({ statusCode: 400, message: "Cannot remove yourself" });
	}

	const [membership] = await db
		.select()
		.from(orgMembers)
		.where(and(eq(orgMembers.userId, user.id), eq(orgMembers.orgId, orgId)))
		.limit(1);

	if (!membership) {
		throw createError({ statusCode: 403, message: "Not a member of this org" });
	}

	try {
		const removed = await removeLocalMember(db, {
			memberId,
			orgId,
			actorRole: membership.role as "owner" | "admin" | "member",
		});
		return removed;
	} catch (e: any) {
		if (e.message?.includes("No permission")) {
			throw createError({ statusCode: 403, message: e.message });
		}
		throw e;
	}
});
