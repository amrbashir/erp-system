import { defineEventHandler, readBody, createError } from "nitro/h3";
import { useDatabase } from "../../utils/db";
import { isSetupComplete, setupOwner } from "../../lib/local-auth";
import { toSlug } from "../../lib/slug";

export default defineEventHandler(async (event) => {
	const db = useDatabase();

	if (await isSetupComplete(db)) {
		throw createError({ statusCode: 409, message: "Setup already complete" });
	}

	const body = await readBody<{
		orgName: string;
		username: string;
		password: string;
		name: string;
	}>(event);

	if (!body?.orgName || !body?.username || !body?.password || !body?.name) {
		throw createError({
			statusCode: 400,
			message: "orgName, username, password, and name required",
		});
	}

	const slug = toSlug(body.orgName);
	if (!slug) {
		throw createError({ statusCode: 400, message: "Invalid org name" });
	}

	const result = await setupOwner(db, {
		orgName: body.orgName,
		orgSlug: slug,
		username: body.username,
		password: body.password,
		name: body.name,
	});

	return {
		token: result.session.token,
		user: { id: result.user.id, name: result.user.name, username: result.user.username },
		org: { id: result.org.id, name: result.org.name, slug: result.org.slug },
	};
});
