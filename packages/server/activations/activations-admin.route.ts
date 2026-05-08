import { adminAuthed } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";

/**
 * Admin-only activations procedures. Mounted ONLY by the admin deployment
 * (DEPLOY_TARGET=admin) — never reachable from the public web `/api`.
 * Gated by `adminAuthed` so anonymous traffic is rejected.
 */
export const adminActivationsRouter = {
	list: adminAuthed.activations.list.handler(({ context }) => {
		return context.activationsService.list();
	}),

	toggleStatus: adminAuthed.activations.toggleStatus.handler(async ({ context, input }) => {
		unwrap(await context.activationsService.toggleStatus(input.id, input.status));
	}),
};
