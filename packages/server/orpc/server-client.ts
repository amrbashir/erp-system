import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";

import { orgsService } from "./handler.js";
import { router, type AppRouter } from "./router.js";

/**
 * Build an SSR/in-process oRPC client bound to the given Request.
 *
 * Dispatches procedures directly against the local router (no HTTP
 * round-trip), reusing the same service singletons used by the HTTP
 * mount. `event` is null because there's no h3 event during SSR —
 * cookie-writing procedures (e.g. `orgs.switch`) will reject; only
 * read-side calls are valid here.
 */
export function createSSRClient(request: Request): RouterClient<AppRouter> {
	return createRouterClient(router, {
		context: {
			request,
			event: null,
			orgsService,
		},
	});
}
