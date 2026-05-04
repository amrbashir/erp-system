import { adminActivationsRouter } from "../activations/activations-admin.route.js";

/**
 * Admin oRPC router. Mounted only by the admin deployment
 * (DEPLOY_TARGET=admin) so these procedures are never reachable from the
 * public web `/rpc` surface — that's the whole point of the split.
 *
 * Reuses `AppContext` via the same `pub` builder; service singletons are
 * shared.
 */
export const adminRouter = {
	activations: adminActivationsRouter,
};

export type AdminRouter = typeof adminRouter;
