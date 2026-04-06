import {
	defineEventHandler,
	readBody,
	toRequest,
	createError,
	getCookie,
} from "h3";
import { auth } from "../../../../../src/lib/auth";
import { useDB } from "../../../../utils/db";
import { getOrgMembership } from "../../../../lib/org";
import { addMemberToOrg } from "../../../../lib/org-members";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session)
		throw createError({ statusCode: 401, message: "Unauthorized" });

	const orgId = getCookie(event, "current_org_id");
	if (!orgId)
		throw createError({ statusCode: 400, message: "No org selected" });

	const db = useDB();
	const membership = await getOrgMembership(db, session.user.id, orgId);
	if (!membership)
		throw createError({
			statusCode: 403,
			message: "Not a member of this org",
		});

	const actorRole = membership.role as "owner" | "admin" | "member";
	if (actorRole === "member") {
		throw createError({
			statusCode: 403,
			message: "No permission to add members",
		});
	}

	const body = await readBody<{
		name: string;
		email: string;
		role: "owner" | "admin" | "member";
	}>(event);

	if (!body?.name || !body?.email || !body?.role) {
		throw createError({
			statusCode: 400,
			message: "name, email, and role required",
		});
	}

	// admin can only create members
	if (actorRole === "admin" && body.role !== "member") {
		throw createError({
			statusCode: 403,
			message: "Admins can only create members",
		});
	}

	// find or create user by email
	let [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, body.email))
		.limit(1);

	if (!user) {
		[user] = await db
			.insert(users)
			.values({ name: body.name, email: body.email })
			.returning();
	}

	try {
		const member = await addMemberToOrg(db, {
			orgId,
			userId: user.id,
			role: body.role,
		});
		return member;
	} catch (e: any) {
		if (e.message?.includes("unique") || e.code === "23505") {
			throw createError({
				statusCode: 409,
				message: "User is already a member of this org",
			});
		}
		throw e;
	}
});
