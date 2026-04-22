import { users } from "@workspace/db/schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

import type { CreateAuthOptions } from "./auth.js";
import { createOrg } from "./org.js";

type DB = PgDatabase<any, any>;

interface DesktopSetupInput {
	email: string;
	password: string;
	name: string;
	orgName: string;
	slug: string;
	username?: string;
}

type CreateAuthFn = (
	options: CreateAuthOptions,
) => ReturnType<typeof import("./auth.js").createAuth>;

export async function desktopSetup(
	db: DB,
	input: DesktopSetupInput,
	createAuth: CreateAuthFn,
	authOptions?: Omit<CreateAuthOptions, "db">,
) {
	// check if setup already complete (any user exists)
	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	if (existing) {
		throw new Error("Setup already complete");
	}

	return db.transaction(async (tx) => {
		const txAuth = createAuth({
			desktop: true,
			...authOptions,
			db: tx,
		});

		const signup = await txAuth.api.signUpEmail({
			body: {
				email: input.email,
				password: input.password,
				name: input.name,
				username: input.username,
			},
		});

		const org = await createOrg(tx as unknown as DB, {
			name: input.orgName,
			slug: input.slug,
			userId: signup.user.id,
		});

		return {
			token: signup.token,
			user: { id: signup.user.id, name: signup.user.name, email: signup.user.email },
			org: { id: org.id, name: org.name, slug: org.slug },
		};
	});
}
