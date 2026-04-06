import { defineEventHandler, createError, getQuery } from "nitro/h3";
import { requireSession } from "../../../utils/auth";
import { useDatabase } from "../../../utils/db";
import { getLocalOrgMembers } from "../../../lib/local-auth";
import { eq } from "drizzle-orm";
import { orgMembers } from "@workspace/db/schema";

export default defineEventHandler(async (event) => {
	const { user } = await requireSession(event);
	const db = useDatabase();

	const query = getQuery(event);
	const orgId = query.orgId as string;
	if (!orgId) {
		throw createError({ statusCode: 400, message: "orgId required" });
	}

	// verify user is a member
	const [membership] = await db
		.select()
		.from(orgMembers)
		.where(eq(orgMembers.userId, user.id))
		.limit(1);

	if (!membership || membership.orgId !== orgId) {
		throw createError({ statusCode: 403, message: "Not a member of this org" });
	}

	return getLocalOrgMembers(db, orgId);
});
