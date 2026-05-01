import { defineEventHandler } from "h3";

import { toHTTPError } from "~/lib/http-errors";
import { listInvitations } from "~/lib/invitations";
import { requireOrg } from "~/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db } = guard;
	return listInvitations(db, orgId);
});
