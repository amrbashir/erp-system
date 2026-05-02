import { defineEventHandler, readBody, toRequest } from "h3";

import { useDatabase } from "#db";
import { auth } from "@workspace/server/lib/auth";
import { InvalidInputError, UnauthorizedError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { createOrg } from "@workspace/server/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api
		.getSession({ headers: toRequest(event as any).headers })
		.catch((e: Error) => e);
	if (session instanceof Error) throw toHTTPError(session);
	if (!session) throw toHTTPError(new UnauthorizedError());

	const body = await readBody<{ name: string; slug: string; currency?: string }>(event);
	if (!body?.name || !body?.slug) {
		throw toHTTPError(new InvalidInputError({ reason: "name and slug required" }));
	}

	const db = useDatabase();

	const result = await createOrg(db, {
		name: body.name,
		slug: body.slug,
		userId: session.user.id,
		currency: body.currency,
	});
	if (result instanceof Error) throw toHTTPError(result);
	return result;
});
