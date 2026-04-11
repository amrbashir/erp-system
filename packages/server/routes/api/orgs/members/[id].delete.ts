import { defineEventHandler, toRequest, createError, getCookie, getRouterParam } from "h3";

import { auth } from "#auth";
import { useDatabase } from "#db";

import { getOrgMembership } from "@/lib/org";
import { removeMember } from "@/lib/org-members";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw createError({ statusCode: 401, message: "Unauthorized" });

	const orgId = getCookie(event, "current_org_id");
	if (!orgId) throw createError({ statusCode: 400, message: "No org selected" });

	const memberId = getRouterParam(event, "id");
	if (!memberId) throw createError({ statusCode: 400, message: "Member ID required" });

	const db = useDatabase();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership)
		throw createError({
			statusCode: 403,
			message: "Not a member of this org",
		});

	// prevent self-removal
	if (memberId === membership.id) {
		throw createError({
			statusCode: 400,
			message: "Cannot remove yourself",
		});
	}

	try {
		await removeMember(db, {
			memberId,
			orgId,
			actorRole: membership.role as "owner" | "admin" | "member",
		});
		return { ok: true };
	} catch (e: any) {
		if (e.message?.includes("permission")) {
			throw createError({ statusCode: 403, message: e.message });
		}
		if (e.message === "Member not found") {
			throw createError({ statusCode: 404, message: e.message });
		}
		throw e;
	}
});
