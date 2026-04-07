import { orgMembers } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { defineEventHandler, createError, getQuery } from "nitro/h3";

import { getLocalOrgMembers } from "../../../lib/local-auth";
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

	return getLocalOrgMembers(db, orgId);
});
