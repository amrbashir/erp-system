import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";

import { buildContext } from "./context.js";
import { adminRouter, type AdminRouter, router, type AppRouter } from "./router.js";

/**
 * Build an SSR/in-process oRPC client bound to the given Request.
 *
 * Dispatches procedures directly against the local router (no HTTP
 * round-trip), reusing the same per-request context factory the HTTP
 * mount uses.
 */
export function createSSRClient(request: Request): RouterClient<AppRouter> {
	return createRouterClient(router, { context: buildContext(request) });
}

/** SSR client for the admin router (admin deployment only). */
export function createAdminSSRClient(request: Request): RouterClient<AdminRouter> {
	return createRouterClient(adminRouter, { context: buildContext(request) });
}
