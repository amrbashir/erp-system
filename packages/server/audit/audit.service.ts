import { auditLogs } from "@workspace/db/schema";

import type { DB } from "../shared/db.js";

export interface AuditEntry {
	orgId: string;
	actorId: string;
	action: string;
	targetType?: string;
	targetId?: string;
	metadata?: Record<string, unknown>;
}

/** Failures surface to caller - transactional callers decide swallow vs propagate. */
export class AuditService {
	constructor(private readonly deps: { db: DB }) {}

	async log(entry: AuditEntry): Promise<void> {
		await this.deps.db.insert(auditLogs).values(entry);
	}
}
