import { sql } from "drizzle-orm";

/**
 * SQL statements to enable RLS and create org isolation policies.
 * Run these after migrations to set up row-level security.
 *
 * Expects a Postgres session variable `app.current_org_id` to be set
 * before queries (e.g., via `SET app.current_org_id = '<uuid>'`).
 */

const tenantTables = ["org_members"] as const;

export const enableRls = tenantTables.map((table) =>
	sql.raw(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`),
);

export const createPolicies = tenantTables.map((table) =>
	sql.raw(
		`CREATE POLICY org_isolation_${table} ON "${table}" USING (org_id = current_setting('app.current_org_id')::uuid)`,
	),
);

export const dropPolicies = tenantTables.map((table) =>
	sql.raw(
		`DROP POLICY IF EXISTS org_isolation_${table} ON "${table}"`,
	),
);

export const rlsStatements = [...enableRls, ...createPolicies];
