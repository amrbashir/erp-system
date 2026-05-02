import { defineEventHandler } from "h3";

import { toHTTPError } from "@workspace/server/lib/http-errors";
import { listInvitations } from "@workspace/server/lib/invitations";
import { requireOrg } from "@workspace/server/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db } = guard;
	return listInvitations(db, orgId);
});
