import { users } from "@workspace/db/schema";

import type { CreateAuthOptions, createAuth as CreateAuthFn } from "../lib/auth.js";
import { OrgsService } from "../orgs/orgs.service.js";
import type { DB } from "../shared/db.js";
import {
	InvalidSlugError,
	SetupAlreadyCompleteError,
	SlugTakenError,
	UnsupportedCurrencyError,
} from "../shared/errors.js";
type CreateAuth = typeof CreateAuthFn;

export interface DesktopSetupInput {
	email: string;
	password: string;
	name: string;
	orgName: string;
	slug: string;
}

export type DesktopSetupOk = {
	token: string | null;
	user: { id: string; name: string; email: string };
	org: { id: string; name: string; slug: string };
};

/**
 * Owns the desktop first-run flow. Runs signup + org creation in one
 * transaction so a slug-conflict can't strand a half-created user.
 *
 * `createAuth` is constructor-injected so tests can pass a transactional
 * auth instance with explicit `baseURL`/`secret`; production wires the
 * real factory via `handler.ts`.
 */
export class SetupService {
	constructor(
		private readonly deps: {
			db: DB;
			createAuth: CreateAuth;
			authOptions?: Omit<CreateAuthOptions, "db">;
		},
	) {}

	/** Probe used by the desktop bootstrap to choose between setup vs login. */
	async isComplete(): Promise<boolean> {
		const [existing] = await this.deps.db.select({ id: users.id }).from(users).limit(1);
		return !!existing;
	}

	async run(
		input: DesktopSetupInput,
	): Promise<
		| SetupAlreadyCompleteError
		| InvalidSlugError
		| UnsupportedCurrencyError
		| SlugTakenError
		| Error
		| DesktopSetupOk
	> {
		if (await this.isComplete()) return new SetupAlreadyCompleteError();

		try {
			return await this.deps.db.transaction(async (tx) => {
				const txAuth = this.deps.createAuth({
					desktop: true,
					...this.deps.authOptions,
					db: tx,
				});

				const signup = await txAuth.api.signUpEmail({
					body: {
						email: input.email,
						password: input.password,
						name: input.name,
					},
				});

				const org = await new OrgsService({ db: tx }).create({
					name: input.orgName,
					slug: input.slug,
					userId: signup.user.id,
				});
				if (org instanceof Error) throw org; // rollback

				return {
					token: signup.token,
					user: {
						id: signup.user.id,
						name: signup.user.name,
						email: signup.user.email,
					},
					org: { id: org.id, name: org.name, slug: org.slug },
				};
			});
		} catch (e) {
			if (e instanceof Error) return e;
			throw e;
		}
	}
}
