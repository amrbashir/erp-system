import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../schema/index.js";

export function useDatabase() {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL environment variable is required");
	}
	const sql = postgres(process.env.DATABASE_URL);
	return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof useDatabase>;
