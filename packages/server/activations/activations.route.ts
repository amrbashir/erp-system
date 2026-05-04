import * as z from "zod";

import { pub } from "../orpc/base.js";
import { unwrap } from "../orpc/unwrap.js";
import { RateLimitedError } from "../shared/errors.js";
import { createRateLimiter } from "../shared/rate-limit.js";

const checkInput = z.object({
	hardwareId: z.string().min(1),
});

// Module-scope singleton: one bucket shared across all callers (matches the
// legacy Nitro route). 10 hits per minute per IP.
const limiter = createRateLimiter({ window: 60_000, max: 10 });

/**
 * Public activations router — only the desktop activation handshake is
 * exposed here. Admin operations (list / toggleStatus) live in
 * `activations-admin.route.ts` and are mounted only by the admin
 * deployment.
 */
export const activationsRouter = {
	check: pub.input(checkInput).handler(async ({ context, input }) => {
		if (!limiter(context.request)) throw new RateLimitedError();
		return unwrap(await context.activationsService.checkAndIssue(input.hardwareId));
	}),
};
