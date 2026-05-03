import { invitationsRouter } from "../invitations/invitations.route.js";
import { membersRouter } from "../members/members.route.js";
import { orgsRouter } from "../orgs/orgs.route.js";

import { pub } from "./base.js";

/**
 * Root oRPC router. Domain sub-routers merged here as they migrate:
 *   Phase 2: orgs
 *   Phase 3: members, invitations    ← we are here
 *   Phase 4: auth, activations
 *
 * `ping` stays as a no-context smoke-test for the handler/client wiring.
 */
export const router = {
	ping: pub.handler(() => ({ ok: true as const, ts: Date.now() })),
	orgs: orgsRouter,
	members: membersRouter,
	invitations: invitationsRouter,
};

export type AppRouter = typeof router;
