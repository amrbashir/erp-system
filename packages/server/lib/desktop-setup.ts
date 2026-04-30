import { users } from "@workspace/db/schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

import type { CreateAuthOptions } from "./auth.js";
import {
	InvalidSlugError,
	SetupAlreadyCompleteError,
	SlugTakenError,
	UnsupportedCurrencyError,
} from "./errors.js";
import { createOrg } from "./org.js";

type DB = PgDatabase<any, any>;

interface DesktopSetupInput {
	username: string;
	password: string;
	name: string;
	orgName: string;
	slug: string;
}

type CreateAuthFn = (
	options: CreateAuthOptions,
) => ReturnType<typeof import("./auth.js").createAuth>;

type DesktopSetupOk = {
	token: string | null;
	user: { id: string; name: string; username: string };
	org: { id: string; name: string; slug: string };
};

/** Desktop is offline, no real email — synthesize a deterministic local one. */
export function synthesizeDesktopEmail(username: string): string {
	return `${username}@desktop.local`;
}

export async function desktopSetup(
	db: DB,
	input: DesktopSetupInput,
	createAuth: CreateAuthFn,
	authOptions?: Omit<CreateAuthOptions, "db">,
): Promise<
	| SetupAlreadyCompleteError
	| InvalidSlugError
	| UnsupportedCurrencyError
	| SlugTakenError
	| Error
	| DesktopSetupOk
> {
	// check if setup already complete (any user exists)
	const [existing] = await db.select({ id: users.id }).from(users).limit(1);
	if (existing) {
		return new SetupAlreadyCompleteError();
	}

	// throws inside the transaction trigger rollback; we catch outside and convert to returns.
	try {
		return await db.transaction(async (tx) => {
			const txAuth = createAuth({
				desktop: true,
				...authOptions,
				db: tx,
			});

			const signup = await txAuth.api.signUpEmail({
				body: {
					email: synthesizeDesktopEmail(input.username),
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
			if (org instanceof Error) throw org; // rollback

			return {
				token: signup.token,
				user: { id: signup.user.id, name: signup.user.name, username: input.username },
				org: { id: org.id, name: org.name, slug: org.slug },
			};
		});
	} catch (e) {
		// any Error (tagged or better-auth APIError) → return so caller can route via toHTTPError.
		if (e instanceof Error) return e;
		throw e;
	}
}
