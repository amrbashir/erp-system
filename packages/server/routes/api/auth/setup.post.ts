import emailValidator from "email-validator";
import { defineEventHandler, readBody } from "h3";

import { useDatabase } from "#db";
import { createAuth } from "@workspace/server/lib/auth";
import { desktopSetup } from "@workspace/server/lib/desktop-setup";
import { InvalidEmailError, InvalidInputError, InvalidSlugError } from "@workspace/server/lib/errors";
import { toHTTPError } from "@workspace/server/lib/http-errors";
import { toSlug } from "@workspace/server/lib/slug";

export default defineEventHandler(async (event) => {
	const db = useDatabase();

	const body = await readBody<{
		email: string;
		password: string;
		name: string;
		orgName: string;
	}>(event);

	if (!body?.email || !body?.password || !body?.name || !body?.orgName) {
		throw toHTTPError(
			new InvalidInputError({ reason: "email, password, name, and orgName required" }),
		);
	}

	if (!emailValidator.validate(body.email)) {
		throw toHTTPError(new InvalidEmailError());
	}

	const slug = toSlug(body.orgName);
	if (!slug) {
		throw toHTTPError(new InvalidSlugError({ reason: "Invalid org name" }));
	}

	const result = await desktopSetup(
		db,
		{
			email: body.email,
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
