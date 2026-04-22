import { users } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { defineEventHandler, readBody, toRequest, HTTPError, getCookie } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { getOrgMembership } from "~/lib/org";
import { addMemberToOrg } from "~/lib/org-members";
import { isValidEmail } from "~/lib/validate-email";

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

	const actorRole = membership.role as "owner" | "admin" | "member";
	if (actorRole === "member") {
		throw new HTTPError("No permission to add members", {
			status: 403,
		});
	}

	const body = await readBody<{
		name: string;
		email: string;
		role: "owner" | "admin" | "member";
	}>(event);

	if (!body?.name || !body?.email || !body?.role) {
		throw new HTTPError("name, email, and role required", {
			status: 400,
		});
	}

	if (!isValidEmail(body.email)) {
		throw new HTTPError("Invalid email format", { status: 400 });
	}

	// admin can only create members
	if (actorRole === "admin" && body.role !== "member") {
		throw new HTTPError("Admins can only create members", {
			status: 403,
		});
	}

	// find or create user by email (case-insensitive)
	let [user] = await db
		.select()
		.from(users)
		.where(eq(sql`lower(${users.email})`, sql`lower(${body.email})`))
		.limit(1);

	if (!user) {
		[user] = await db.insert(users).values({ name: body.name, email: body.email }).returning();
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
			throw new HTTPError("User is already a member of this org", {
				status: 409,
			});
		}
		throw e;
	}
});
