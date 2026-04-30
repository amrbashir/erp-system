import { defineEventHandler, readBody } from "h3";

import { useDatabase } from "#db";
import { createAuth } from "~/lib/auth";
import { desktopSetup } from "~/lib/desktop-setup";
import { InvalidInputError, InvalidSlugError } from "~/lib/errors";
import { toHTTPError } from "~/lib/http-errors";
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
		throw toHTTPError(
			new InvalidInputError({ reason: "email, password, name, and orgName required" }),
		);
	}

	const slug = toSlug(body.orgName);
	if (!slug) {
		throw toHTTPError(new InvalidSlugError({ reason: "Invalid org name" }));
	}

	// desktopSetup catches internally and returns Error (incl. better-auth APIError).
	const result = await desktopSetup(
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
	if (result instanceof Error) throw toHTTPError(result);
	return result;
});
