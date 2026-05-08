import { oc } from "@orpc/contract";

import { adminActivationsContract } from "../activations/activations-admin.contract.js";
import { activationsContract } from "../activations/activations.contract.js";
import { invitationsContract } from "../invitations/invitations.contract.js";
import { membersContract } from "../members/members.contract.js";
import { orgsContract } from "../orgs/orgs.contract.js";
import { sessionContract } from "../session/session.contract.js";
import { setupContract } from "../setup/setup.contract.js";

/**
 * Composed source-of-truth contract for the public API. Per-domain pieces
 * live next to their `.route.ts` (e.g. `members/members.contract.ts`); this
 * file just stitches them into a single tree.
 *
 * Browser-safe — clients import this to drive `OpenAPILink`.
 *
 * The server router (orpc/router.ts) implements this via `implement(contract)`
 * — TypeScript enforces every contract entry has a matching handler.
 */
export const contract = {
	ping: oc.route({ method: "GET", path: "/ping" }),
	session: sessionContract,
	setup: setupContract,
	activations: activationsContract,
	orgs: orgsContract,
	members: membersContract,
	invitations: invitationsContract,
};

/** Admin-only contract. Mounted exclusively by DEPLOY_TARGET=admin. */
export const adminContract = {
	activations: adminActivationsContract,
};

export type AppContract = typeof contract;
export type AdminContract = typeof adminContract;
