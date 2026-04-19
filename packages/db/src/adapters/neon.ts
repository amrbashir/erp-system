import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../schema/index.js";

export function useDatabase() {
	const sql = neon(process.env.DATABASE_URL!);
	return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof useDatabase>;
