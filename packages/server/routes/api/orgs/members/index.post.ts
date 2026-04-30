import { lower } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import emailValidator from "email-validator";
import { defineEventHandler, readBody } from "h3";

import { logAudit } from "~/lib/audit";
import { InvalidEmailError, InvalidInputError, NoPermissionError } from "~/lib/errors";
import { toHTTPError } from "~/lib/http-errors";
import { addMemberToOrg } from "~/lib/org-members";
import { requireOrg } from "~/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db, membership, session } = guard;

	const actorRole = membership.role as "owner" | "admin" | "member";
	if (actorRole === "member") {
		throw toHTTPError(new NoPermissionError({ reason: "No permission to add members" }));
	}

	const body = await readBody<{
		name: string;
		email: string;
		role: "owner" | "admin" | "member";
	}>(event);

	if (!body?.name || !body?.email || !body?.role) {
		throw toHTTPError(new InvalidInputError({ reason: "name, email, and role required" }));
	}

	if (!emailValidator.validate(body.email)) {
		throw toHTTPError(new InvalidEmailError());
	}

	// admin can only create members
	if (actorRole === "admin" && body.role !== "member") {
		throw toHTTPError(new NoPermissionError({ reason: "Admins can only create members" }));
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

	const member = await addMemberToOrg(db, {
		orgId,
		userId: user.id,
		role: body.role,
	});
	if (member instanceof Error) throw toHTTPError(member);

	await logAudit(db, {
		orgId,
		actorId: session.user.id,
		action: "member.add",
		targetType: "member",
		targetId: member.id,
		metadata: { role: body.role, email: body.email },
	});
	return member;
});
