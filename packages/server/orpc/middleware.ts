import { auth } from "../lib/auth.js";
import { readCookie } from "../shared/cookie.js";
import {
	NoOrgSelectedError,
	NotOrgMemberError,
	RateLimitedError,
	UnauthorizedError,
} from "../shared/errors.js";
import { createRateLimiter } from "../shared/rate-limit.js";
import { pub } from "./base.js";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
type Membership = NonNullable<
	Awaited<ReturnType<import("../orgs/orgs.service.js").OrgsService["getMembership"]>>
>;

/**
 * Per-IP token bucket. Call once at module scope (each call allocates its
 * own bucket map) and chain `.input()/.handler()` like any pub builder.
 */
export function rateLimited(opts: { window: number; max: number }) {
	const check = createRateLimiter(opts);
	return pub.use(async ({ context, next }) => {
		if (!check(context.request)) throw new RateLimitedError();
		return next();
	});
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

/**
 * Layered on top of `authed`: requires a current org id (header
 * `x-org-id` for desktop bearer flow, falling back to the session
 * cookie) and resolves the user's membership in that org.
 */
export const orgScoped = authed.use(async ({ context, next }) => {
	const orgId =
		context.request.headers.get("x-org-id") ??
		readCookie(context.request, "current_org_id") ??
		null;
	if (!orgId) throw new NoOrgSelectedError();

	const membership = await context.orgsService.getMembership(context.session.user.id, orgId);
	if (!membership) throw new NotOrgMemberError();

	return next({ context: { ...context, orgId, membership: membership as Membership } });
});
