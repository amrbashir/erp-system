import { neon } from "@neondatabase/serverless";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/neon-http";

export function useDatabase() {
	const sql = neon(process.env.DATABASE_URL!);
	return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof useDatabase>;
