import { orgs, orgMembers } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";

import { validateCurrency } from "./currency.js";
import {
	InvalidSlugError,
	SlugTakenError,
	type UnsupportedCurrencyError,
} from "./errors.js";
import { validateSlug } from "./slug.js";

type DB = PgDatabase<any, any>;
type Org = typeof orgs.$inferSelect;

export async function createOrg(
	db: DB,
	input: { name: string; slug: string; userId: string; currency?: string },
): Promise<InvalidSlugError | UnsupportedCurrencyError | SlugTakenError | Error | Org> {
	const slugErr = validateSlug(input.slug);
	if (slugErr) return slugErr;

	if (input.currency) {
		const curErr = validateCurrency(input.currency);
		if (curErr) return curErr;
	}

	try {
		return await db.transaction(async (tx) => {
			const [org] = await tx
				.insert(orgs)
				.values({
					name: input.name,
					slug: input.slug,
					...(input.currency ? { defaultCurrency: input.currency } : {}),
				})
				.returning();

			await tx.insert(orgMembers).values({
				orgId: org.id,
				userId: input.userId,
				role: "owner",
			});

			return org;
		});
	} catch (err: any) {
		const cause = err?.cause ?? err;
		if (cause?.code === "23505" && cause?.constraint?.includes("slug")) {
			return new SlugTakenError();
		}
		if (err instanceof Error) return err;
		throw err;
	}
}

export async function getUserOrgs(db: DB, userId: string) {
	const rows = await db
		.select({
			id: orgs.id,
			name: orgs.name,
			slug: orgs.slug,
			defaultCurrency: orgs.defaultCurrency,
			role: orgMembers.role,
		})
		.from(orgMembers)
		.innerJoin(orgs, eq(orgMembers.orgId, orgs.id))
		.where(eq(orgMembers.userId, userId));

	return rows;
}

export async function getOrgMembership(db: DB, userId: string, orgId: string) {
	const [row] = await db
		.select()
		.from(orgMembers)
		.where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
		.limit(1);

	return row ?? null;
}
