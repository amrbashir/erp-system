import { auth } from "../lib/auth.js";
import { pub, rateLimited } from "../orpc/middleware.js";

// Hot path: every page load. Lenient — caps amplification attacks
// without choking legitimate SSR/navigation traffic.
const limited = rateLimited({ window: 60_000, max: 120 });

/**
 * Session lookup for client + SSR consumers. Returns `null` on auth
 * failure rather than throwing — the route loader (TanStack `beforeLoad`)
 * decides whether a missing session is a redirect or a 401.
 *
 * Reads from `context.request.headers` so it works for both web (cookie)
 * and desktop (Authorization: Bearer via the bearer plugin).
 */
export const sessionRouter = {
	get: pub.session.get.use(limited).handler(async ({ context }) => {
		return auth.api.getSession({ headers: context.request.headers }).catch(() => null);
	}),
};
