import { setCookie } from "h3";
import * as z from "zod";

import { pub } from "../orpc/base.js";
import { authed } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { orgSwitchCookieOptions, readCookie } from "../shared/cookie.js";
import { NotOrgMemberError, ServerMisconfiguredError } from "../shared/errors.js";

const createInput = z.object({
	name: z.string().min(1),
	slug: z.string().min(1),
	currency: z.string().optional(),
});

const switchInput = z.object({
	orgId: z.string().uuid(),
});

export const orgsRouter = {
	/**
	 * Resolve the active org id from `x-org-id` (desktop bearer flow) or
	 * the `current_org_id` cookie (web). Returns null when neither set —
	 * lets route loaders decide redirect vs. picker UI.
	 */
	current: pub.handler(({ context }) => {
		const headerOrgId = context.request.headers.get("x-org-id");
		if (headerOrgId) return { orgId: headerOrgId };
		return { orgId: readCookie(context.request, "current_org_id") };
	}),

	/** All orgs the current user belongs to. */
	list: authed.handler(({ context }) => {
		return context.orgsService.listByUser(context.session.user.id);
	}),

	/** Create a new org; creator becomes its first owner. */
	create: authed.input(createInput).handler(async ({ context, input }) => {
		return unwrap(
			await context.orgsService.create({
				name: input.name,
				slug: input.slug,
				userId: context.session.user.id,
				currency: input.currency,
			}),
		);
	}),

	/** Set the cookie that scopes subsequent web requests to `orgId`. */
	switch: authed.input(switchInput).handler(async ({ context, input }) => {
		// Cookie write is HTTP-only — SSR loaders shouldn't switch orgs.
		if (!context.event) {
			throw new ServerMisconfiguredError({
				reason: "orgs.switch must be called over HTTP, not via SSR router-client",
			});
		}

		const membership = await context.orgsService.getMembership(
			context.session.user.id,
			input.orgId,
		);
		if (!membership) throw new NotOrgMemberError();

		setCookie(context.event, "current_org_id", input.orgId, orgSwitchCookieOptions());
		return { orgId: input.orgId };
	}),
};
