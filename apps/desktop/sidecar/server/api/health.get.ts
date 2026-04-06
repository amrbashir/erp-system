import { sql } from "drizzle-orm";
import { defineEventHandler } from "nitro/h3";
import { useDatabase } from "../utils/db";

export default defineEventHandler(async () => {
	const db = useDatabase();
	await db.execute(sql`SELECT 1`);
	return { status: "ok" };
});
