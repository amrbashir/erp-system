import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@workspace/db/schema";

export function useDB() {
	const sql = neon(process.env.DATABASE_URL!);
	return drizzle(sql, { schema });
}
