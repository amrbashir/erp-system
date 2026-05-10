import { authed } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";

export const orgsRouter = {
	list: authed.orgs.list.handler(({ context }) => {
		return context.orgsService.listByUser(context.session.user.id);
	}),

	/** Creator becomes first owner. */
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
