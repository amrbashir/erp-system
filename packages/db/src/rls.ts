import { sql } from "drizzle-orm";

/** SQL statements to enable RLS and create org isolation policies on tenant-scoped tables. */
export const rlsStatements = [
	// Enable RLS on tenant-scoped tables
	sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
	sql`ALTER TABLE sessions ENABLE ROW LEVEL SECURITY`,
	sql`ALTER TABLE accounts ENABLE ROW LEVEL SECURITY`,
	sql`ALTER TABLE org_members ENABLE ROW LEVEL SECURITY`,

	// Users: isolate by org_id
	sql`CREATE POLICY org_isolation_users ON users
		USING (org_id = current_setting('app.current_org_id')::uuid)`,

	// Sessions: isolate via user's org_id
	sql`CREATE POLICY org_isolation_sessions ON sessions
		USING (user_id IN (SELECT id FROM users WHERE org_id = current_setting('app.current_org_id')::uuid))`,

	// Accounts: isolate via user's org_id
	sql`CREATE POLICY org_isolation_accounts ON accounts
		USING (user_id IN (SELECT id FROM users WHERE org_id = current_setting('app.current_org_id')::uuid))`,

	// Org members: isolate by org_id
	sql`CREATE POLICY org_isolation_org_members ON org_members
		USING (org_id = current_setting('app.current_org_id')::uuid)`,
];
