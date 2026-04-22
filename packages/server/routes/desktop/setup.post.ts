import { defineEventHandler, readBody, HTTPError } from "h3";

import { useDatabase } from "#db";
import { createAuth } from "~/lib/auth";
import { desktopSetup } from "~/lib/desktop-setup";
import { toSlug } from "~/lib/slug";

export default defineEventHandler(async (event) => {
	const db = useDatabase();

	const body = await readBody<{
		email: string;
		password: string;
		name: string;
		orgName: string;
		username?: string;
	}>(event);

	if (!body?.email || !body?.password || !body?.name || !body?.orgName) {
		throw new HTTPError("email, password, name, and orgName required", {
			status: 400,
		});
	}

	const slug = toSlug(body.orgName);
	if (!slug) {
		throw new HTTPError("Invalid org name", { status: 400 });
	}

	try {
		return await desktopSetup(
			db,
			{
				email: body.email,
				password: body.password,
				name: body.name,
				orgName: body.orgName,
				slug,
				username: body.username,
			},
			createAuth,
		);
	} catch (err) {
		if (err instanceof Error && /setup already complete/i.test(err.message)) {
			throw new HTTPError("Setup already complete", { status: 409 });
		}
		throw err;
	}
});
