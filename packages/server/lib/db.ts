import { useNitroApp } from "nitro/app";

import type { Database } from "#db";

export type { Database } from "#db";

declare module "nitro/types" {
	interface NitroApp {
		db: Database;
	}
}

export function useDatabase(): Database {
	const app = useNitroApp();
	if (!app.db) throw new Error("Database not initialized - init plugin missing or failed");
	return app.db;
}
