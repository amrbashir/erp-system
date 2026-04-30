import { defineEventHandler, readBody } from "h3";

import { auth } from "~/lib/auth";
import { synthesizeDesktopEmail } from "~/lib/desktop-setup";
import { InvalidInputError } from "~/lib/errors";
import { toHTTPError } from "~/lib/http-errors";

export default defineEventHandler(async (event) => {
	const body = await readBody<{ username: string; password: string }>(event);

	if (!body?.username || !body?.password) {
		throw toHTTPError(new InvalidInputError({ reason: "username and password required" }));
	}

	const result = await auth.api
		.signInEmail({
			body: { email: synthesizeDesktopEmail(body.username), password: body.password },
		})
		.catch((e: Error) => e);
	if (result instanceof Error) throw toHTTPError(result);

	return {
		token: result.token,
		user: {
			id: result.user.id,
			name: result.user.name,
			username: body.username,
		},
	};
});
