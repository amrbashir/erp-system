import emailValidator from "email-validator";
import { defineEventHandler, readBody } from "h3";

import { logAudit } from "@workspace/server/lib/audit";
import { InvalidEmailError, InvalidInputError, NoPermissionError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { clearInvitationsForEmail, findUserByEmail, sendInvitation } from "@workspace/server/lib/invitations";
import { addMemberToOrg } from "@workspace/server/lib/org-members";
import { requireOrg } from "@workspace/server/lib/require-org";

/**
 * "Add a user by email" — branches on whether the email is already registered:
 *  - existing user → add to org as member, clear any stale invitations
 *  - new email → create a pending invitation, consumed on signup
 */
export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db, membership, session } = guard;

	const actorRole = membership.role as "owner" | "admin" | "member";
	if (actorRole === "member") {
		throw toHTTPError(new NoPermissionError({ reason: "No permission to add members" }));
	}

	const body = await readBody<{
		email: string;
		role: "owner" | "admin" | "member";
	}>(event);

	if (!body?.email || !body?.role) {
		throw toHTTPError(new InvalidInputError({ reason: "email and role required" }));
	}

	if (!emailValidator.validate(body.email)) {
		throw toHTTPError(new InvalidEmailError());
	}

	if (actorRole === "admin" && body.role !== "member") {
		throw toHTTPError(new NoPermissionError({ reason: "Admins can only add members" }));
	}

	const existing = await findUserByEmail(db, body.email);
	if (existing) {
		const member = await addMemberToOrg(db, {
			orgId,
			userId: existing.id,
			role: body.role,
		});
		if (member instanceof Error) throw toHTTPError(member);

		await clearInvitationsForEmail(db, { orgId, email: body.email });

		await logAudit(db, {
			orgId,
			actorId: session.user.id,
			action: "member.add",
			targetType: "member",
			targetId: member.id,
			metadata: { role: body.role, email: body.email },
		});
		return { kind: "member" as const, member };
	}

	const invitation = await sendInvitation(db, {
		orgId,
		email: body.email,
		role: body.role,
		invitedBy: session.user.id,
	});
	if (invitation instanceof Error) throw toHTTPError(invitation);

	await logAudit(db, {
		orgId,
		actorId: session.user.id,
		action: "invitation.send",
		targetType: "invitation",
		targetId: invitation.id,
		metadata: { role: body.role, email: body.email },
	});
	return { kind: "invitation" as const, invitation };
});
