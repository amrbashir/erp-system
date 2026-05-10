import { auth } from "../lib/auth.js";
import { pub, rateLimited } from "../orpc/middleware.js";

// Hot path (every page load) - lenient cap blocks amplification without choking SSR/navigation.
const limited = rateLimited({ window: 60_000, max: 120 });

/** Returns `null` on auth failure - `beforeLoad` decides redirect vs 401. */
export const sessionRouter = {
	get: pub.session.get.use(limited).handler(async ({ context }) => {
		return auth.api.getSession({ headers: context.request.headers }).catch(() => null);
	}),
};
