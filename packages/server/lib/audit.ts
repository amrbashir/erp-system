import type { PgDatabase } from "drizzle-orm/pg-core";

import { AuditService } from "../audit/audit.service.js";

type DB = PgDatabase<any, any>;

/**
 * Compat shim for legacy Nitro routes. The single source of truth is
 * `AuditService`; this wrapper stays until the remaining Nitro routes
 * are deleted (Phase 5 cleanup).
 */
export async function logAudit(
	db: DB,
	entry: {
		orgId: string;
		actorId: string;
		action: string;
		targetType?: string;
		targetId?: string;
		metadata?: Record<string, unknown>;
	},
) {
	return new AuditService({ db }).log(entry);
}
