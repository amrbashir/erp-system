import type { PgDatabase } from "drizzle-orm/pg-core";

import { OrgsService } from "../orgs/orgs.service.js";

type DB = PgDatabase<any, any>;

/**
 * Compat shim for legacy Nitro routes / TanStack server fns. The single
 * source of truth is `OrgsService`; these wrappers stay until the
 * remaining Nitro routes are deleted (Phase 5 cleanup).
 */
export async function createOrg(
	db: DB,
	input: { name: string; slug: string; userId: string; currency?: string },
) {
	return new OrgsService({ db }).create(input);
}

export async function getUserOrgs(db: DB, userId: string) {
	return new OrgsService({ db }).listByUser(userId);
}

export async function getOrgMembership(db: DB, userId: string, orgId: string) {
	return new OrgsService({ db }).getMembership(userId, orgId);
}
