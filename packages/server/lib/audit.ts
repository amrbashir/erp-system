import { auditLogs } from "@workspace/db/schema";

import type { DB } from "../shared/db.js";

export type AuditEntry = Omit<typeof auditLogs.$inferInsert, "id" | "createdAt">;

/** Pass `tx` to write inside a caller's transaction, or the request-scoped `db` for fire-and-forget. Failures surface to caller - they decide swallow vs propagate. */
export async function logAudit(db: DB, entry: AuditEntry): Promise<void> {
	await db.insert(auditLogs).values(entry);
}
