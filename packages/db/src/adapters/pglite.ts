import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";

import * as schema from "../schema/index.js";

export type Database = PgliteDatabase<typeof schema>;

export async function initDatabase(dataDir?: string): Promise<Database> {
	const client = new PGlite(dataDir || undefined);
	return drizzle(client, { schema });
}
