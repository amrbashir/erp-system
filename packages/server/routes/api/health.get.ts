import { sql } from "drizzle-orm";
import { defineEventHandler } from "h3";

import { useDatabase } from "#db";

/**
 * Liveness + readiness probe. Returns 200 with `db: "ok"` when the database
 * is reachable, 503 with `db: "error"` otherwise. Used by:
 *  - desktop sidecar readiness gate (frontend polls before issuing API calls)
 *  - container orchestrators (k8s/docker healthchecks)
 *  - monitoring
 */
export default defineEventHandler(async (event) => {
	const db = useDatabase();
	try {
		await db.execute(sql`select 1`);
		return { status: "ok", db: "ok" as const };
	} catch (e) {
		event.res.status = 503;
		return {
			status: "degraded" as const,
			db: "error" as const,
			error: e instanceof Error ? e.message : String(e),
		};
	}
});
