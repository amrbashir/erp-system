import { orgs, orgMembers } from "@workspace/db/schema";
import { InvalidSlugError } from "@workspace/shared/errors";
import { validateSlug } from "@workspace/shared/slug";
import { eq, and } from "drizzle-orm";

import { validateCurrency } from "../shared/currency.js";
import type { DB } from "../shared/db.js";
import { isPgUniqueViolationOn, SlugTakenError, UnsupportedCurrencyError } from "../shared/errors.js";
type Org = typeof orgs.$inferSelect;
type OrgMember = typeof orgMembers.$inferSelect;

/** Methods return `T | Error`; procedure layer unwraps at the boundary. */
export class OrgsService {
	constructor(private readonly deps: { db: DB }) {}

	async create(input: {
		name: string;
		slug: string;
		userId: string;
		currency?: string;
	}): Promise<InvalidSlugError | UnsupportedCurrencyError | SlugTakenError | Error | Org> {
		const slugErr = validateSlug(input.slug);
		if (slugErr) return slugErr;

		if (input.currency) {
			const curErr = validateCurrency(input.currency);
			if (curErr) return curErr;
		}

		try {
			return await this.deps.db.transaction(async (tx) => {
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
		} catch (err) {
			if (isPgUniqueViolationOn(err, "slug")) return new SlugTakenError();
			if (err instanceof Error) return err;
			throw err;
		}
	}

	async listByUser(userId: string) {
		return this.deps.db
			.select({
				id: orgs.id,
				name: orgs.name,
				slug: orgs.slug,
				defaultCurrency: orgs.defaultCurrency,
			})
			.from(orgMembers)
			.innerJoin(orgs, eq(orgMembers.orgId, orgs.id))
			.where(eq(orgMembers.userId, userId));
	}

	async getMembership(userId: string, orgId: string): Promise<OrgMember | null> {
		const [row] = await this.deps.db
			.select()
			.from(orgMembers)
			.where(and(eq(orgMembers.userId, userId), eq(orgMembers.orgId, orgId)))
			.limit(1);
		return row ?? null;
	}

	async findBySlug(slug: string): Promise<Org | null> {
		const [row] = await this.deps.db.select().from(orgs).where(eq(orgs.slug, slug)).limit(1);
		return row ?? null;
	}
}
