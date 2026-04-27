import { defineEventHandler } from "h3";

import { requireOrg } from "~/lib/require-org";
import { getOrgMembers } from "~/lib/org-members";

export default defineEventHandler(async (event) => {
	const { orgId, db } = await requireOrg(event);
	return getOrgMembers(db, orgId);
});
