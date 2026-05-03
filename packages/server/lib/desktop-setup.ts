/**
 * Legacy shim: forwards the old function-style API to SetupService. The
 * Nitro `routes/api/auth/setup.post.ts` still imports from here; will be
 * deleted in Phase 5 once that route is removed.
 */
import type { PgDatabase } from "drizzle-orm/pg-core";

import { SetupService, type DesktopSetupInput, type DesktopSetupOk } from "../setup/setup.service.js";
import type {
	InvalidSlugError,
	SetupAlreadyCompleteError,
	SlugTakenError,
	UnsupportedCurrencyError,
} from "../shared/errors.js";

import type { CreateAuthOptions } from "./auth.js";

type DB = PgDatabase<any, any>;
type CreateAuthFn = (
	options?: CreateAuthOptions,
) => ReturnType<typeof import("./auth.js").createAuth>;

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
	return new SetupService({ db, createAuth, authOptions }).run(input);
}
