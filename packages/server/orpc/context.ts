import { useDatabase } from "#db";

import { ActivationsService } from "../activations/activations.service.js";
import { AuditService } from "../audit/audit.service.js";
import { InvitationsService } from "../invitations/invitations.service.js";
import { createAuth } from "../lib/auth.js";
import { MembersService } from "../members/members.service.js";
import { OrgsService } from "../orgs/orgs.service.js";
import { SetupService } from "../setup/setup.service.js";

/**
 * Flat oRPC context: services are top-level fields (`orgsService`, NOT
 * nested `services.orgs`). `request` works for both the HTTP mount and
 * SSR via createRouterClient — middleware reads cookies and auth headers
 * from it.
 */
export interface AppContext {
	request: Request;
	orgsService: OrgsService;
	membersService: MembersService;
	invitationsService: InvitationsService;
	auditService: AuditService;
	activationsService: ActivationsService;
	setupService: SetupService;
}

/**
 * Per-request context factory. Services are constructed here (not at
 * module load) so importing `context.ts` has no side effects — important
 * for the SSR client and tests. `useDatabase()` is itself memoised by
 * Nitro, so we still get a single underlying connection pool.
 */
export function buildContext(request: Request): AppContext {
	const db = useDatabase();
	return {
		request,
		orgsService: new OrgsService({ db }),
		membersService: new MembersService({ db }),
		invitationsService: new InvitationsService({ db }),
		auditService: new AuditService({ db }),
		activationsService: new ActivationsService({
			db,
			privateKey: process.env.ACTIVATION_PRIVATE_KEY,
		}),
		setupService: new SetupService({ db, createAuth }),
	};
}
