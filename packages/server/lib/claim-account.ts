import { accounts } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import type { Auth } from "./auth.js";
import { AccountAlreadyClaimedError } from "./errors.js";

type DB = PgDatabase<any, any>;

export async function claimAccount(
	auth: Auth,
	db: DB,
	input: { userId: string; password: string },
): Promise<AccountAlreadyClaimedError | Error | void> {
	// verify no existing credential account
	const [existing] = await db
		.select()
		.from(accounts)
		.where(eq(accounts.userId, input.userId))
		.limit(1);

	if (existing) {
		return new AccountAlreadyClaimedError();
	}

	// auth.$context / password.hash / db.insert can throw — forward via Error union.
	const ctx = await auth.$context.catch((e: Error) => e);
	if (ctx instanceof Error) return ctx;

	const hash = await ctx.password.hash(input.password).catch((e: Error) => e);
	if (hash instanceof Error) return hash;

	const insertErr = await db
		.insert(accounts)
		.values({
			userId: input.userId,
			accountId: input.userId,
			providerId: "credential",
			password: hash,
		})
		.catch((e: Error) => e);
	if (insertErr instanceof Error) return insertErr;
}
