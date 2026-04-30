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
		username: string;
		password: string;
		name: string;
		orgName: string;
	}>(event);

	if (!body?.username || !body?.password || !body?.name || !body?.orgName) {
		throw toHTTPError(
			new InvalidInputError({ reason: "username, password, name, and orgName required" }),
		);
	}

	const slug = toSlug(body.orgName);
	if (!slug) {
		throw toHTTPError(new InvalidSlugError({ reason: "Invalid org name" }));
	}

	const result = await desktopSetup(
		db,
		{
			username: body.username,
			password: body.password,
			name: body.name,
			orgName: body.orgName,
			slug,
		},
		createAuth,
	);
	if (result instanceof Error) throw toHTTPError(result);
	return result;
});
