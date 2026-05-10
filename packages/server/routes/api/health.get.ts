import { sql } from "drizzle-orm";
import { defineEventHandler } from "h3";

import { useDatabase } from "@workspace/server/lib/db";

/** 200 when DB reachable, 503 otherwise. */
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
