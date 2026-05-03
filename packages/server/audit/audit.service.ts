import { auditLogs } from "@workspace/db/schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

type DB = PgDatabase<any, any>;

export interface AuditEntry {
	orgId: string;
	actorId: string;
	action: string;
	targetType?: string;
	targetId?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Append-only audit log writer. Side-effect only — failures are surfaced
 * to the caller (the procedure layer) so transactional callers can decide
 * whether to swallow or propagate.
 */
export class AuditService {
	constructor(private readonly deps: { db: DB }) {}

	async log(entry: AuditEntry): Promise<void> {
		await this.deps.db.insert(auditLogs).values(entry);
	}
}
