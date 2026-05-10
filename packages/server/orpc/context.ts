import { ActivationsService } from "../activations/activations.service.js";
import { AuditService } from "../audit/audit.service.js";
import { InvitationsService } from "../invitations/invitations.service.js";
import { createAuth } from "../lib/auth.js";
import { useDatabase } from "../lib/db.js";
import { MembersService } from "../members/members.service.js";
import { OrgsService } from "../orgs/orgs.service.js";
import { SetupService } from "../setup/setup.service.js";

/** `request` works for both HTTP mount and SSR via createRouterClient - middleware reads cookies/auth headers from it. */
export interface AppContext {
	request: Request;
	orgsService: OrgsService;
	membersService: MembersService;
	invitationsService: InvitationsService;
	auditService: AuditService;
	activationsService: ActivationsService;
	setupService: SetupService;
}

/** Services constructed per-request so importing `context.ts` has no side effects (matters for SSR + tests). `useDatabase()` is Nitro-memoised. */
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
