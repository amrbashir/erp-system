import { adminPub } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";

/** Mounted only by DEPLOY_TARGET=admin - never reachable from public `/api`, so no auth needed. */
export const adminActivationsRouter = {
	list: adminPub.activations.list.handler(({ context }) => {
		return context.activationsService.list();
	}),

	toggleStatus: adminPub.activations.toggleStatus.handler(async ({ context, input }) => {
		unwrap(await context.activationsService.toggleStatus(input.id, input.status));
	}),
};
