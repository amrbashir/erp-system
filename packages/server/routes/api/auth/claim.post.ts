import { lower } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody, HTTPError } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { claimAccount } from "~/lib/claim-account";
import { validatePassword } from "~/lib/validate-password";

export default defineEventHandler(async (event) => {
	const body = await readBody<{ email: string; password: string }>(event);

	if (!body?.email || !body?.password) {
		throw new HTTPError("email and password required", { status: 400 });
	}

	const result = validatePassword(body.password);
	if (!result.valid) {
		throw new HTTPError(result.message, { status: 400 });
	}

	const db = useDatabase();

	const [user] = await db
		.select()
		.from(users)
		.where(eq(lower(users.email), body.email.toLowerCase()))
		.limit(1);

	if (!user) {
		throw new HTTPError("No account found for this email", { status: 404 });
	}

	try {
		await claimAccount(auth, db, { userId: user.id, password: body.password });
	} catch (e: any) {
		if (e.message === "Account already claimed") {
			throw new HTTPError("Account already claimed, please login", { status: 409 });
		}
		throw e;
	}

	// sign in to create a session
	const session = await auth.api.signInEmail({
		body: { email: body.email, password: body.password },
	});

	return session;
});
