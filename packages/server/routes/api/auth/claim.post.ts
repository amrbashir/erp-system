import { lower } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { claimAccount } from "~/lib/claim-account";
import { InvalidInputError, UserNotFoundError } from "~/lib/errors";
import { toHTTPError } from "~/lib/http-errors";
import { validatePassword } from "~/lib/validate-password";

export default defineEventHandler(async (event) => {
	const body = await readBody<{ email: string; password: string }>(event);

	if (!body?.email || !body?.password) {
		throw toHTTPError(new InvalidInputError({ reason: "email and password required" }));
	}

	const pwErr = validatePassword(body.password);
	if (pwErr) throw toHTTPError(pwErr);

	const db = useDatabase();

	const [user] = await db
		.select()
		.from(users)
		.where(eq(lower(users.email), body.email.toLowerCase()))
		.limit(1);

	if (!user) {
		throw toHTTPError(new UserNotFoundError());
	}

	const claim = await claimAccount(auth, db, { userId: user.id, password: body.password });
	if (claim instanceof Error) throw toHTTPError(claim);

	// sign in to create a session — better-auth throws APIError on failure
	const session = await auth.api
		.signInEmail({
			body: { email: body.email, password: body.password },
		})
		.catch((e: Error) => e);
	if (session instanceof Error) throw toHTTPError(session);

	return session;
});
