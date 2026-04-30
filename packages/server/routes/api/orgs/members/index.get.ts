import { defineEventHandler } from "h3";

import { toHTTPError } from "~/lib/http-errors";
import { getOrgMembers } from "~/lib/org-members";
import { requireOrg } from "~/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db } = guard;
	return getOrgMembers(db, orgId);
});
