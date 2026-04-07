import { orgMembers, orgs } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { defineEventHandler } from "nitro/h3";

import { requireSession } from "../../utils/auth";
import { useDatabase } from "../../utils/db";

export default defineEventHandler(async (event) => {
	const { user } = await requireSession(event);

	const db = useDatabase();
	const userOrgs = await db
		.select({
			id: orgs.id,
			name: orgs.name,
			slug: orgs.slug,
			defaultCurrency: orgs.defaultCurrency,
			role: orgMembers.role,
		})
		.from(orgMembers)
		.innerJoin(orgs, eq(orgMembers.orgId, orgs.id))
		.where(eq(orgMembers.userId, user.id));

	return {
		user: { id: user.id, name: user.name, username: user.username },
		orgs: userOrgs,
	};
});
