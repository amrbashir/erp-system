import type { Database } from "#db";

export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Services accept either so callers can pass `tx` to nest writes inside a transaction. */
export type DB = Database | Tx;
