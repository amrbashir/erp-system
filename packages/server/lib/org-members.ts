import type { PgDatabase } from "drizzle-orm/pg-core";

import { MembersService } from "../members/members.service.js";

type DB = PgDatabase<any, any>;
type Role = "owner" | "admin" | "member";

/**
 * Compat shim for legacy Nitro routes. The single source of truth is
 * `MembersService`; these wrappers stay until the remaining Nitro routes
 * are deleted (Phase 5 cleanup).
 */
export async function getOrgMembers(db: DB, orgId: string) {
	return new MembersService({ db }).list(orgId);
}

export async function addMemberToOrg(
	db: DB,
	input: { orgId: string; userId: string; role: Role },
) {
	return new MembersService({ db }).add(input);
}

export async function updateMemberRole(
	db: DB,
	input: {
		memberId: string;
		orgId: string;
		actorRole: Role;
		newRole: Role;
		actorMemberId?: string;
	},
) {
	return new MembersService({ db }).updateRole(input);
}

export async function removeMember(
	db: DB,
	input: { memberId: string; orgId: string; actorRole: Role },
) {
	return new MembersService({ db }).remove(input);
}

export async function transferOwnership(
	db: DB,
	input: {
		orgId: string;
		actorMemberId: string;
		targetMemberId: string;
		newActorRole: "admin" | "member";
	},
) {
	return new MembersService({ db }).transferOwnership(input);
}
