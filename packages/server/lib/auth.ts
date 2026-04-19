import * as schema from "@workspace/db/schema";
import { betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { useDatabase } from "#db";

export interface CreateAuthOptions {
	plugins?: BetterAuthOptions["plugins"];
	desktop?: boolean;
	baseURL?: string;
	secret?: string;
}

export function createAuth(options: CreateAuthOptions = {}) {
	const db = useDatabase();

	return betterAuth({
		baseURL: options.baseURL,
		secret: options.secret,
		database: drizzleAdapter(db, {
			provider: "pg",
			usePlural: true,
			schema,
		}),
		advanced: {
			database: {
				generateId: "uuid",
			},
		},
		user: {
			additionalFields: {
				username: {
					type: "string",
					required: false,
				},
				phone: {
					type: "string",
					required: false,
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: options.desktop ? false : undefined,
		},
		plugins: options.plugins ?? [],
	});
}

export type Auth = ReturnType<typeof createAuth>;

export const auth = createAuth({
	desktop: process.env.DEPLOY_TARGET === "desktop",
});
