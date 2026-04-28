import { auditLogs } from "@workspace/db/schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

type DB = PgDatabase<any, any>;

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
	await db.insert(auditLogs).values(entry);
}
