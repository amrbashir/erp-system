import { users } from "@workspace/db/schema";
import { defineEventHandler, readBody, createError } from "h3";

import { auth } from "#auth";
import { useDatabase } from "#db";

import { createOrg } from "../../lib/org";

function toSlug(name: string) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export default defineEventHandler(async (event) => {
	const db = useDatabase();

	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	if (existing) {
		throw createError({ statusCode: 409, message: "Setup already complete" });
	}

	const body = await readBody<{
		email: string;
		password: string;
		name: string;
		orgName: string;
		username?: string;
	}>(event);

	if (!body?.email || !body?.password || !body?.name || !body?.orgName) {
		throw createError({
			statusCode: 400,
			message: "email, password, name, and orgName required",
		});
	}

	const slug = toSlug(body.orgName);
	if (!slug) {
		throw createError({ statusCode: 400, message: "Invalid org name" });
	}

	const signup = await auth.api.signUpEmail({
		body: {
			email: body.email,
			password: body.password,
			name: body.name,
			username: body.username,
		},
	});

	const org = await createOrg(db, {
		name: body.orgName,
		slug,
		userId: signup.user.id,
	});

	return {
		token: signup.token,
		user: { id: signup.user.id, name: signup.user.name, email: signup.user.email },
		org: { id: org.id, name: org.name, slug: org.slug },
	};
});
