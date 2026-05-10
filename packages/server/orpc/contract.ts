import { oc } from "@orpc/contract";

import { adminActivationsContract } from "../activations/activations-admin.contract.js";
import { activationsContract } from "../activations/activations.contract.js";
import { invitationsContract } from "../invitations/invitations.contract.js";
import { membersContract } from "../members/members.contract.js";
import { orgsContract } from "../orgs/orgs.contract.js";
import { sessionContract } from "../session/session.contract.js";
import { setupContract } from "../setup/setup.contract.js";

/** Browser-safe public API contract. Domain pieces live next to their `.route.ts`. */
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
