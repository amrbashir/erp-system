import { pub, rateLimited } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";

const checkLimit = rateLimited({ window: 60_000, max: 10 });

/** Public - only the desktop handshake. Admin ops live in `activations-admin.route.ts`. */
export const activationsRouter = {
	check: pub.activations.check.use(checkLimit).handler(async ({ context, input }) => {
		return unwrap(await context.activationsService.checkAndIssue(input.hardwareId));
	}),
};
