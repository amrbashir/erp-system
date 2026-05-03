import { RPCHandler } from "@orpc/server/fetch";
import type { H3Event } from "h3";

import { useDatabase } from "#db";

import { AuditService } from "../audit/audit.service.js";
import { InvitationsService } from "../invitations/invitations.service.js";
import { MembersService } from "../members/members.service.js";
import { OrgsService } from "../orgs/orgs.service.js";

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

/** Per-request context factory used by the HTTP mount. */
export function buildContext(event: H3Event): AppContext {
	return {
		request: event.req,
		event,
		orgsService,
		membersService,
		invitationsService,
		auditService,
	};
}

/** Single shared RPCHandler instance. */
export const rpcHandler = new RPCHandler<AppContext>(router);
