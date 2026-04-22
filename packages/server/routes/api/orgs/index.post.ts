import { defineEventHandler, readBody, toRequest, HTTPError } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { createOrg } from "~/lib/org";

export default defineEventHandler(async (event) => {
	const session = await auth.api.getSession({
		headers: toRequest(event as any).headers,
	});
	if (!session) throw new HTTPError("Unauthorized", { status: 401 });

	const body = await readBody<{ name: string; slug: string; currency?: string }>(event);
	if (!body?.name || !body?.slug) {
		throw new HTTPError("name and slug required", { status: 400 });
	}

	const db = useDatabase();

	try {
		return await createOrg(db, {
			name: body.name,
			slug: body.slug,
			userId: session.user.id,
			currency: body.currency,
		});
	} catch (err) {
		if (err instanceof Error) {
			if (/slug already taken/i.test(err.message)) {
				throw new HTTPError("Slug already taken", { status: 409 });
			}
			if (/slug must|unsupported currency/i.test(err.message)) {
				throw new HTTPError(err.message, { status: 400 });
			}
		}
		throw err;
	}
});
