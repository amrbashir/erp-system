import { defineEventHandler, readBody, toRequest, HTTPError, getCookie } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { getOrgMembership } from "~/lib/org";
import { transferOwnership } from "~/lib/org-members";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw new HTTPError("Unauthorized", { status: 401 });

	const orgId = getCookie(event, "current_org_id");
	if (!orgId) throw new HTTPError("No org selected", { status: 400 });

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership)
		throw new HTTPError("Not a member of this org", {
			status: 403,
		});

	if (membership.role !== "owner") {
		throw new HTTPError("Only owners can transfer ownership", {
			status: 403,
		});
	}

	const body = await readBody<{
		targetMemberId: string;
		newActorRole: "admin" | "member";
	}>(event);

	if (!body?.targetMemberId || !body?.newActorRole) {
		throw new HTTPError("targetMemberId and newActorRole required", {
			status: 400,
		});
	}

	if (!["admin", "member"].includes(body.newActorRole)) {
		throw new HTTPError("newActorRole must be admin or member", {
			status: 400,
		});
	}

	try {
		const result = await transferOwnership(db, {
			orgId,
			actorMemberId: membership.id,
			targetMemberId: body.targetMemberId,
			newActorRole: body.newActorRole,
		});
		return result;
	} catch (e: any) {
		if (e.message?.includes("Cannot") || e.message?.includes("Only owners")) {
			throw new HTTPError(e.message, { status: 403 });
		}
		if (e.message?.includes("not found")) {
			throw new HTTPError(e.message, { status: 404 });
		}
		throw e;
	}
});
