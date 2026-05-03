import type { PgDatabase } from "drizzle-orm/pg-core";

import { InvitationsService } from "../invitations/invitations.service.js";

type DB = PgDatabase<any, any>;
type Role = "owner" | "admin" | "member";

/**
 * Compat shim for legacy Nitro routes + the auth post-signup hook. The
 * single source of truth is `InvitationsService`; these wrappers stay
 * until the remaining Nitro routes are deleted (Phase 5 cleanup).
 */
export async function sendInvitation(
	db: DB,
	input: { orgId: string; email: string; role: Role; invitedBy: string },
) {
	return new InvitationsService({ db }).send(input);
}

export async function listInvitations(db: DB, orgId: string) {
	return new InvitationsService({ db }).list(orgId);
}

export async function revokeInvitation(
	db: DB,
	input: { orgId: string; invitationId: string },
) {
	return new InvitationsService({ db }).revoke(input);
}

export async function clearInvitationsForEmail(db: DB, input: { orgId: string; email: string }) {
	return new InvitationsService({ db }).clearForEmail(input);
}

export async function consumeInvitations(db: DB, input: { userId: string; email: string }) {
	return new InvitationsService({ db }).consume(input);
}

export async function findUserByEmail(db: DB, email: string) {
	return new InvitationsService({ db }).findUserByEmail(email);
}
