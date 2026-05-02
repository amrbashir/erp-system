import { defineEventHandler, readBody } from "h3";

import { logAudit } from "@workspace/server/lib/audit";
import { InvalidInputError, NoPermissionError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { transferOwnership } from "@workspace/server/lib/org-members";
import { requireOrg } from "@workspace/server/lib/require-org";

export default defineEventHandler(async (event) => {
	const guard = await requireOrg(event);
	if (guard instanceof Error) throw toHTTPError(guard);
	const { orgId, db, membership, session } = guard;

	if (membership.role !== "owner") {
		throw toHTTPError(new NoPermissionError({ reason: "Only owners can transfer ownership" }));
	}

	const body = await readBody<{
		targetMemberId: string;
		newActorRole: "admin" | "member";
	}>(event);

	if (!body?.targetMemberId || !body?.newActorRole) {
		throw toHTTPError(
			new InvalidInputError({ reason: "targetMemberId and newActorRole required" }),
		);
	}

	if (!["admin", "member"].includes(body.newActorRole)) {
		throw toHTTPError(
			new InvalidInputError({ reason: "newActorRole must be admin or member" }),
		);
	}

	const result = await transferOwnership(db, {
		orgId,
		actorMemberId: membership.id,
		targetMemberId: body.targetMemberId,
		newActorRole: body.newActorRole,
	});
	if (result instanceof Error) throw toHTTPError(result);

	await logAudit(db, {
		orgId,
		actorId: session.user.id,
		action: "member.transfer_ownership",
		targetType: "member",
		targetId: body.targetMemberId,
		metadata: { newActorRole: body.newActorRole },
	});
	return result;
});
