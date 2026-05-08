import { type Middleware, implement } from "@orpc/server";

import { auth } from "../lib/auth.js";
import { NotOrgMemberError, RateLimitedError, UnauthorizedError } from "../shared/errors.js";
import { createRateLimiter } from "../shared/rate-limit.js";
import { adminContract, contract } from "./contract.js";
import type { AppContext } from "./context.js";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type Membership = NonNullable<
	Awaited<ReturnType<import("../orgs/orgs.service.js").OrgsService["getMembership"]>>
>;

/**
 * Contract-first oRPC builders. `implement(contract).$context<AppContext>()`
 * gives a router-shaped builder where each entry already carries the
 * contract's input schema, method, and path — handlers just call `.handler()`.
 *
 * Domain routers chain off `pub` (or `authed` / org-scoped variants below)
 * to inherit the full service context.
 */
export const pub = implement(contract).$context<AppContext>();
export const adminPub = implement(adminContract).$context<AppContext>();

/**
 * Per-IP token bucket as a middleware factory. Call once at module scope
 * (each call allocates its own bucket map) and pass to `.use()` on any
 * builder.
 */
export function rateLimited(opts: { window: number; max: number }): Middleware<
	AppContext,
	Record<never, never>,
	// biome-ignore lint/suspicious/noExplicitAny: pass-through middleware must accept any input/output
	any,
	// biome-ignore lint/suspicious/noExplicitAny: pass-through middleware must accept any input/output
	any,
	// biome-ignore lint/suspicious/noExplicitAny: error map / meta are sub-router specific
	any,
	// biome-ignore lint/suspicious/noExplicitAny: error map / meta are sub-router specific
	any
> {
	const check = createRateLimiter(opts);
	return async ({ context, next }) => {
		if (!check(context.request)) throw new RateLimitedError();
		return next();
	};
}

/**
 * Resolves the better-auth session from the request headers. Reads
 * `request` (not `event`) so it works under SSR via createRouterClient
 * too. Throws `UnauthorizedError` (401) on no session or auth failure —
 * middleware is the one place we throw rather than return errors.
 */
export const authed = pub.use(async ({ context, next }) => {
	const session = await auth.api
		.getSession({ headers: context.request.headers })
		.catch(() => null);
	if (!session) throw new UnauthorizedError();
	return next({ context: { ...context, session: session as Session } });
});

export const adminAuthed = adminPub.use(async ({ context, next }) => {
	const session = await auth.api
		.getSession({ headers: context.request.headers })
		.catch(() => null);
	if (!session) throw new UnauthorizedError();
	return next({ context: { ...context, session: session as Session } });
});

/**
 * Resolves slug → org → membership and adds `orgId` + `membership` to
 * context. Apply via `authed.<sub>.use(orgResolver)` on a sub-router
 * whose contract entries all carry `{orgSlug}` in input. OpenAPI handler
 * merges path params into validated input before middleware runs, so
 * reading `orgSlug` from the runtime input object is safe.
 */
export const orgResolver: Middleware<
	AppContext & { session: Session },
	{ orgId: string; membership: Membership },
	// biome-ignore lint/suspicious/noExplicitAny: input shape is per-procedure; we read orgSlug at runtime
	any,
	// biome-ignore lint/suspicious/noExplicitAny: pass-through output
	any,
	// biome-ignore lint/suspicious/noExplicitAny: error map / meta are sub-router specific
	any,
	// biome-ignore lint/suspicious/noExplicitAny: error map / meta are sub-router specific
	any
> = async ({ context, next }, input) => {
	const slug = (input as { orgSlug?: string }).orgSlug;
	if (!slug) throw new NotOrgMemberError();
	const org = await context.orgsService.findBySlug(slug);
	if (!org) throw new NotOrgMemberError();
	const membership = await context.orgsService.getMembership(context.session.user.id, org.id);
	if (!membership) throw new NotOrgMemberError();
	return next({ context: { orgId: org.id, membership: membership as Membership } });
};
