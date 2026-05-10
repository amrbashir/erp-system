import { adminActivationsRouter } from "../activations/activations-admin.route.js";
import { activationsRouter } from "../activations/activations.route.js";
import { invitationsRouter } from "../invitations/invitations.route.js";
import { membersRouter } from "../members/members.route.js";
import { orgsRouter } from "../orgs/orgs.route.js";
import { sessionRouter } from "../session/session.route.js";
import { setupRouter } from "../setup/setup.route.js";
import { pub } from "./middleware.js";

/** `ping` is a no-context smoke-test for handler/client wiring. */
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

/** Mounted only by DEPLOY_TARGET=admin - never reachable from public `/api`. */
export const adminRouter = {
	activations: adminActivationsRouter,
};

export type AdminRouter = typeof adminRouter;
