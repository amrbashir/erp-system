import { implement, os } from "@orpc/server";

import { useAuth } from "../lib/auth.js";
import { NotOrgMemberError, RateLimitedError, UnauthorizedError } from "../shared/errors.js";
import { createRateLimiter } from "../shared/rate-limit.js";
import type { AppContext } from "./context.js";
import { adminContract, contract } from "./contract.js";

type Session = NonNullable<Awaited<ReturnType<ReturnType<typeof useAuth>["api"]["getSession"]>>>;

/** Contract-first builders. Domain routers chain off these to inherit AppContext. */
export const pub = implement(contract).$context<AppContext>();
export const adminPub = implement(adminContract).$context<AppContext>();

// Contract-less builders for reusable middleware with context typing.
const baseMw = os.$context<AppContext>();
const authedMw = os.$context<AppContext & { session: Session }>();

/** Per-IP token bucket. Call once at module scope (each call allocates a fresh bucket map). */
export function rateLimited(opts: { window: number; max: number }) {
	const check = createRateLimiter(opts);
	return baseMw.middleware(async ({ context, next }) => {
		if (!check(context.request)) throw new RateLimitedError();
		return next();
	});
}

/** Reads `request` (not `event`) so SSR via createRouterClient works. Middleware throws (rest of code returns T|Error). */
export const authed = pub.use(async ({ context, next }) => {
	const session = await useAuth()
		.api.getSession({ headers: context.request.headers })
		.catch(() => null);
	if (!session) throw new UnauthorizedError();
	return next({ context: { ...context, session } });
});

/** Adds `orgId` + `membership` to context. OpenAPI merges path params into input before middleware runs, so `orgSlug` is on the runtime input object. */
export const orgResolver = authedMw.middleware(async ({ context, next }, input) => {
	const slug = (input as { orgSlug?: string }).orgSlug;
	if (!slug) throw new NotOrgMemberError();
	const org = await context.orgsService.findBySlug(slug);
	if (!org) throw new NotOrgMemberError();
	const membership = await context.orgsService.getMembership(context.session.user.id, org.id);
	if (!membership) throw new NotOrgMemberError();
	return next({ context: { orgId: org.id, membership } });
});
