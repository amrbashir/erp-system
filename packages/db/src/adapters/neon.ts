import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { MissingEnvError } from "../errors.js";
import * as schema from "../schema/index.js";

export async function initDatabase() {
	if (!process.env.DATABASE_URL) {
		throw new MissingEnvError({ envName: "DATABASE_URL" });
	}
	const sql = neon(process.env.DATABASE_URL);
	return drizzle(sql, { schema });
}

export type Database = Awaited<ReturnType<typeof initDatabase>>;
