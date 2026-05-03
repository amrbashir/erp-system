import * as z from "zod";

import { pub } from "../orpc/base.js";
import { unwrap } from "../orpc/unwrap.js";
import { RateLimitedError } from "../shared/errors.js";
import { createRateLimiter } from "../shared/rate-limit.js";

const checkInput = z.object({
	hardwareId: z.string().min(1),
});

const toggleStatusInput = z.object({
	id: z.uuid(),
	status: z.enum(["active", "revoked"]),
});

// Module-scope singleton: one bucket shared across all callers (matches the
// legacy Nitro route). 10 hits per minute per IP.
const limiter = createRateLimiter({ window: 60_000, max: 10 });

/**
 * Activations router.
 *
 * `check` is public + rate-limited — it's the desktop activation handshake.
 * `list` / `toggleStatus` mirror the original admin server-fns; auth gating
 * (admin role) can be layered on later via a middleware.
 */
export const activationsRouter = {
	check: pub.input(checkInput).handler(async ({ context, input }) => {
		if (!limiter(context.request)) throw new RateLimitedError();
		return unwrap(await context.activationsService.checkAndIssue(input.hardwareId));
	}),

	list: pub.handler(({ context }) => {
		return context.activationsService.list();
	}),

	toggleStatus: pub.input(toggleStatusInput).handler(async ({ context, input }) => {
		return unwrap(await context.activationsService.toggleStatus(input.id, input.status));
	}),
};
