import { sql } from "drizzle-orm";
import { rlsStatements } from "./rls.ts";

/** Apply RLS policies. Call after running Drizzle migrations. */
export async function applyRls(db: { execute: (query: ReturnType<typeof sql>) => Promise<unknown> }) {
	for (const stmt of rlsStatements) {
		await db.execute(stmt);
	}
}

/** Set the current org context for RLS policies within a transaction. */
export function setOrgContext(orgId: string) {
	return sql`SELECT set_config('app.current_org_id', ${orgId}, true)`;
}
