import { orgsRouter } from "../orgs/orgs.route.js";

import { pub } from "./base.js";

/**
 * Root oRPC router. Domain sub-routers merged here as they migrate:
 *   Phase 2: orgs                   ← we are here
 *   Phase 3: members, invitations
 *   Phase 4: auth, activations
 *
 * `ping` stays as a no-context smoke-test for the handler/client wiring.
 */
export const router = {
	ping: pub.handler(() => ({ ok: true as const, ts: Date.now() })),
	orgs: orgsRouter,
};

export type AppRouter = typeof router;
