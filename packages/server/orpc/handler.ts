import { RPCHandler } from "@orpc/server/fetch";
import type { H3Event } from "h3";

import { useDatabase } from "#db";

import { ActivationsService } from "../activations/activations.service.js";
import { AuditService } from "../audit/audit.service.js";
import { InvitationsService } from "../invitations/invitations.service.js";
import { createAuth } from "../lib/auth.js";
import { MembersService } from "../members/members.service.js";
import { OrgsService } from "../orgs/orgs.service.js";
import { SetupService } from "../setup/setup.service.js";

import { adminRouter } from "./admin-router.js";
import type { AppContext } from "./context.js";
import { router } from "./router.js";

/**
 * Service singletons — instantiated once at module load. Constructor DI:
 * each takes its own deps explicitly. New services are added here as
 * domains migrate.
 *
 * `db` is resolved from `useDatabase()` (Nitro caches lazily) so the
 * singletons are safe across requests.
 */
const db = useDatabase();
export const orgsService = new OrgsService({ db });
export const membersService = new MembersService({ db });
export const invitationsService = new InvitationsService({ db });
export const auditService = new AuditService({ db });
export const activationsService = new ActivationsService({
	db,
	privateKey: process.env.ACTIVATION_PRIVATE_KEY,
});
export const setupService = new SetupService({ db, createAuth });

/** Per-request context factory used by the HTTP mount. */
export function buildContext(event: H3Event): AppContext {
	return {
		request: event.req,
		event,
		orgsService,
		membersService,
		invitationsService,
		auditService,
		activationsService,
		setupService,
	};
}

/** Public RPCHandler — mounted by web + desktop. */
export const rpcHandler = new RPCHandler<AppContext>(router);

/** Admin RPCHandler — mounted only by the admin deployment. */
export const adminRpcHandler = new RPCHandler<AppContext>(adminRouter);
