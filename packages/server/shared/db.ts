import type { Database } from "#db";

/** A drizzle transaction object yielded inside `db.transaction(async tx => ...)`. */
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * The active drizzle adapter's DB *or* a tx. Services accept either so callers
 * can pass `tx` to nest writes inside a transaction without re-instantiating
 * the underlying connection.
 */
export type DB = Database | Tx;
