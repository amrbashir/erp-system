import { activationsRouter } from "../activations/activations.route.js";
import { invitationsRouter } from "../invitations/invitations.route.js";
import { membersRouter } from "../members/members.route.js";
import { orgsRouter } from "../orgs/orgs.route.js";
import { sessionRouter } from "../session/session.route.js";
import { setupRouter } from "../setup/setup.route.js";
import { pub } from "./base.js";

/**
 * Root oRPC router. Domain sub-routers merged here as they migrate:
 *   Phase 2: orgs
 *   Phase 3: members, invitations
 *   Phase 4: setup, activations
 *   Phase 5: session (kills last server-fns)
 *
 * `ping` stays as a no-context smoke-test for the handler/client wiring.
 */
export const router = {
	ping: pub.handler(() => ({ ok: true as const, ts: Date.now() })),
	session: sessionRouter,
	orgs: orgsRouter,
	members: membersRouter,
	invitations: invitationsRouter,
	activations: activationsRouter,
	setup: setupRouter,
};

export type AppRouter = typeof router;
