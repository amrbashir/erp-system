import { adminActivationsRouter } from "../activations/activations-admin.route.js";
import { activationsRouter } from "../activations/activations.route.js";
import { invitationsRouter } from "../invitations/invitations.route.js";
import { membersRouter } from "../members/members.route.js";
import { orgsRouter } from "../orgs/orgs.route.js";
import { sessionRouter } from "../session/session.route.js";
import { setupRouter } from "../setup/setup.route.js";
import { pub } from "./middleware.js";

/**
 * Root oRPC router. Each domain sub-router implements its slice of the
 * `contract` (see contract.ts) — TypeScript via `implement()` enforces
 * the shape match.
 *
 * `ping` is a no-context smoke-test for the handler/client wiring.
 */
export const router = {
	ping: pub.ping.handler(() => ({ ok: true as const, ts: Date.now() })),
	session: sessionRouter,
	orgs: orgsRouter,
	members: membersRouter,
	invitations: invitationsRouter,
	activations: activationsRouter,
	setup: setupRouter,
};

export type AppRouter = typeof router;

/**
 * Admin oRPC router. Mounted only by the admin deployment
 * (DEPLOY_TARGET=admin) so these procedures are never reachable from the
 * public web `/api` surface. Reuses `AppContext`.
 */
export const adminRouter = {
	activations: adminActivationsRouter,
};

export type AdminRouter = typeof adminRouter;
