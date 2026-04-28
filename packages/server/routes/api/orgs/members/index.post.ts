import { lower } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import emailValidator from "email-validator";
import { defineEventHandler, readBody, HTTPError } from "h3";

import { requireOrg } from "~/lib/require-org";
import { addMemberToOrg } from "~/lib/org-members";
import { logAudit } from "~/lib/audit";

export default defineEventHandler(async (event) => {
	const { orgId, db, membership, session } = await requireOrg(event);

	const actorRole = membership.role as "owner" | "admin" | "member";
	if (actorRole === "member") {
		throw new HTTPError("No permission to add members", { status: 403 });
	}

	const body = await readBody<{
		name: string;
		email: string;
		role: "owner" | "admin" | "member";
	}>(event);

	if (!body?.name || !body?.email || !body?.role) {
		throw new HTTPError("name, email, and role required", { status: 400 });
	}

	if (!emailValidator.validate(body.email)) {
		throw new HTTPError("Invalid email format", { status: 400 });
	}

	// admin can only create members
	if (actorRole === "admin" && body.role !== "member") {
		throw new HTTPError("Admins can only create members", { status: 403 });
	}

	// find or create user by email (case-insensitive)
	let [user] = await db
		.select()
		.from(users)
		.where(eq(lower(users.email), body.email.toLowerCase()))
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
		await logAudit(db, {
			orgId,
			actorId: session.user.id,
			action: "member.add",
			targetType: "member",
			targetId: member.id,
			metadata: { role: body.role, email: body.email },
		});
		return member;
	} catch (e: any) {
		if (e.message?.includes("unique") || e.code === "23505") {
			throw new HTTPError("User is already a member of this org", { status: 409 });
		}
		throw e;
	}
});
