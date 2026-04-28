import { accounts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import type { Auth } from "./auth.js";

type DB = PgDatabase<any, any>;

export async function claimAccount(
	auth: Auth,
	db: DB,
	input: { userId: string; password: string },
) {
	// verify no existing credential account
	const [existing] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.userId, input.userId))
		.limit(1);

	if (existing) {
		throw new Error("Account already claimed");
	}

	const ctx = await auth.$context;
	const hash = await ctx.password.hash(input.password);

	await db.insert(accounts).values({
		userId: input.userId,
		accountId: input.userId,
		providerId: "credential",
		password: hash,
	});
}
