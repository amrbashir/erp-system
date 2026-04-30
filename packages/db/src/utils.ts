import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export function lower(col: AnyPgColumn): SQL {
	return sql`lower(${col})`;
}
