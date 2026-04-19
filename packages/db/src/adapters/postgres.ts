import * as schema from "../schema/index.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function useDatabase() {
	const sql = postgres(process.env.DATABASE_URL!);
	return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof useDatabase>;
