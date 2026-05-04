import * as z from "zod";

import { pub } from "../orpc/base.js";
import { unwrap } from "../orpc/unwrap.js";

const toggleStatusInput = z.object({
	id: z.uuid(),
	status: z.enum(["active", "revoked"]),
});

/**
 * Admin-only activations procedures. Mounted ONLY by the admin deployment
 * (DEPLOY_TARGET=admin) — never reachable from the public web `/rpc`.
 *
 * Auth gating (admin role / shared secret) is layered here, not on the
 * public `activations.route.ts` file.
 */
export const adminActivationsRouter = {
	list: pub.handler(({ context }) => {
		return context.activationsService.list();
	}),

	toggleStatus: pub.input(toggleStatusInput).handler(async ({ context, input }) => {
		return unwrap(await context.activationsService.toggleStatus(input.id, input.status));
	}),
};
