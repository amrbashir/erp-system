import emailValidator from "email-validator";
import * as z from "zod";

import { pub } from "../orpc/base.js";
import { rateLimited } from "../orpc/middleware.js";
import { unwrap } from "../orpc/unwrap.js";
import { InvalidEmailError, InvalidSlugError } from "../shared/errors.js";
import { toSlug, validateSlug } from "../shared/slug.js";

const runInput = z.object({
	email: z.string().min(1),
	password: z.string().min(1),
	name: z.string().min(1),
	orgName: z.string().min(1),
	slug: z.string().optional(),
});

// First-run-only: 5 per hour per IP is generous for legitimate use,
// hostile to brute-force/spam.
const runLimit = rateLimited({ window: 60 * 60_000, max: 5 });

/**
 * Desktop first-run setup. Both procedures are public (`pub`) — the very
 * point of this surface is that no user/session exists yet.
 *
 * `run` validates email + uses the explicit slug if provided (the
 * onboarding form lets the user edit it for the future `/<slug>/...`
 * URL). Falls back to deriving from `orgName` for backwards compat.
 */
export const setupRouter = {
	isComplete: pub.handler(async ({ context }) => {
		const setupComplete = await context.setupService.isComplete();
		return { setupComplete };
	}),

	run: runLimit.input(runInput).handler(async ({ context, input }) => {
		if (!emailValidator.validate(input.email)) throw new InvalidEmailError();

		const slug = input.slug ?? toSlug(input.orgName);
		if (!slug) throw new InvalidSlugError({ reason: "Invalid org name" });
		const slugErr = validateSlug(slug);
		if (slugErr) throw slugErr;

		return unwrap(
			await context.setupService.run({
				email: input.email,
				password: input.password,
				name: input.name,
				orgName: input.orgName,
				slug,
			}),
		);
	}),
};
