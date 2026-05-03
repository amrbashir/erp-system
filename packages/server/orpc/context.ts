import type { H3Event } from "h3";

import type { AuditService } from "../audit/audit.service.js";
import type { InvitationsService } from "../invitations/invitations.service.js";
import type { MembersService } from "../members/members.service.js";
import type { OrgsService } from "../orgs/orgs.service.js";

/**
 * Flat oRPC context: services are top-level fields (`orgsService`, NOT
 * nested `services.orgs`). Service singletons live in `handler.ts`; the
 * per-request shape is built fresh by `buildContext` (HTTP) or by the
 * SSR router-client wrapper.
 *
 * Why both `request` and `event`:
 *  - `request` is the only thing that exists when callers go through
 *    `createRouterClient` (e.g. SSR loaders) — middleware reads cookies
 *    and auth headers from it.
 *  - `event` is only set when called over HTTP via `rpcHandler`; cookie-
 *    *writing* procedures (org switch) need it. Read-only procedures
 *    work either way.
 */
export interface AppContext {
	request: Request;
	event: H3Event | null;
	orgsService: OrgsService;
	membersService: MembersService;
	invitationsService: InvitationsService;
	auditService: AuditService;
}
