import { pub } from "./base.js";

/**
 * Root oRPC router. Domain sub-routers are merged here as they migrate
 * (orgs in Phase 2, members/invitations in Phase 3, etc.).
 *
 * `ping` is a smoke-test procedure — verifies the handler/client wiring
 * end-to-end without depending on db, auth, or services.
 */
export const router = {
	ping: pub.handler(() => ({ ok: true as const, ts: Date.now() })),
};

export type AppRouter = typeof router;
