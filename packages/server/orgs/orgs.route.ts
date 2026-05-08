import { authed } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";

export const orgsRouter = {
	/** All orgs the current user belongs to. */
	list: authed.orgs.list.handler(({ context }) => {
		return context.orgsService.listByUser(context.session.user.id);
	}),

	/** Create a new org; creator becomes its first owner. */
	create: authed.orgs.create.handler(async ({ context, input }) => {
		return unwrap(
			await context.orgsService.create({
				name: input.name,
				slug: input.slug,
				userId: context.session.user.id,
				currency: input.currency,
			}),
		);
	}),
};
