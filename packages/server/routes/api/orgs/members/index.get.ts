import { defineEventHandler } from "h3";

import { toHTTPError } from "~/lib/http-errors";
import { listInvitations } from "~/lib/invitations";
import { getOrgMembers } from "~/lib/org-members";
import { requireOrg } from "~/lib/require-org";

/**
 * Returns a unified list of org members and pending invitations,
 * tagged with a `kind` discriminator so the UI can render a single table.
 */
export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db } = guard;

	const [members, pending] = await Promise.all([
		getOrgMembers(db, orgId),
		listInvitations(db, orgId),
	]);

	return {
		members: members.map((m) => ({ kind: "member" as const, ...m })),
		invitations: pending.map((p) => ({ kind: "invitation" as const, ...p })),
	};
});
