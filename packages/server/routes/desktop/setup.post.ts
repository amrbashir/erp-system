import { users } from "@workspace/db/schema";
import { defineEventHandler, readBody, HTTPError } from "h3";

import { useDatabase } from "#db";
import { auth } from "~/lib/auth";
import { createOrg } from "~/lib/org";

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
		throw new HTTPError("Setup already complete", { status: 409 });
	}

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
