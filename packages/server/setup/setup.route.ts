import emailValidator from "email-validator";
import * as z from "zod";

import { pub } from "../orpc/base.js";
import { unwrap } from "../orpc/unwrap.js";
import { InvalidEmailError, InvalidSlugError } from "../shared/errors.js";
import { toSlug } from "../shared/slug.js";

const runInput = z.object({
	email: z.string().min(1),
	password: z.string().min(1),
	name: z.string().min(1),
	orgName: z.string().min(1),
});

/**
 * Desktop first-run setup. Both procedures are public (`pub`) — the very
 * point of this surface is that no user/session exists yet.
 *
 * `run` validates email + derives the slug from `orgName` here so the
 * service stays focused on the atomic signup+org transaction.
 */
export const setupRouter = {
	isComplete: pub.handler(async ({ context }) => {
		const setupComplete = await context.setupService.isComplete();
		return { setupComplete };
	}),

	run: pub.input(runInput).handler(async ({ context, input }) => {
		if (!emailValidator.validate(input.email)) throw new InvalidEmailError();

		const slug = toSlug(input.orgName);
		if (!slug) throw new InvalidSlugError({ reason: "Invalid org name" });

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
