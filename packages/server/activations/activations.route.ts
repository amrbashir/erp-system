import { pub, rateLimited } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";

const checkLimit = rateLimited({ window: 60_000, max: 10 });

/**
 * Public activations router — only the desktop activation handshake is
 * exposed here. Admin operations (list / toggleStatus) live in
 * `activations-admin.route.ts` and are mounted only by the admin
 * deployment.
 */
export const activationsRouter = {
	check: pub.activations.check.use(checkLimit).handler(async ({ context, input }) => {
		return unwrap(await context.activationsService.checkAndIssue(input.hardwareId));
	}),
};
