import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "@workspace/db/schema";

let _db: PgliteDatabase<typeof schema> | null = null;
let _client: PGlite | null = null;

export type Database = PgliteDatabase<typeof schema>;

export async function initDatabase(dataDir?: string): Promise<Database> {
	if (_db) return _db;
	_client = new PGlite(dataDir || undefined);
	_db = drizzle(_client, { schema });
	return _db;
}

export function useDatabase(): Database {
	if (!_db) throw new Error("Database not initialized");
	return _db;
}
