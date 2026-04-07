import { defineEventHandler, readBody, createError } from "nitro/h3";

import { login } from "../../lib/local-auth";
import { useDatabase } from "../../utils/db";

export default defineEventHandler(async (event) => {
	const body = await readBody<{ username: string; password: string }>(event);

	if (!body?.username || !body?.password) {
		throw createError({ statusCode: 400, message: "username and password required" });
	}

	const db = useDatabase();

	try {
		const result = await login(db, {
			username: body.username,
			password: body.password,
		});

		return {
			token: result.session.token,
			user: { id: result.user.id, name: result.user.name, username: result.user.username },
		};
	} catch {
		throw createError({ statusCode: 401, message: "Invalid credentials" });
	}
});
