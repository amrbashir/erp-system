import * as schema from "@workspace/db/schema";
import { APIError, betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { useDatabase } from "#db";

import { validatePassword } from "./validate-password.js";

export interface CreateAuthOptions {
	plugins?: BetterAuthOptions["plugins"];
	desktop?: boolean;
	baseURL?: string;
	secret?: string;
	db?: any;
}

export function createAuth(options: CreateAuthOptions = {}) {
	const db = options.db ?? useDatabase();

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
			minPasswordLength: 6,
			requireEmailVerification: options.desktop ? false : undefined,
		},
		hooks: {
			before: async (ctx) => {
				if ((ctx as any).path === "/sign-up/email") {
					const body = ctx.body as { password?: string } | undefined;
					if (body?.password) {
						const result = validatePassword(body.password);
						if (!result.valid) {
							throw new APIError("BAD_REQUEST", { message: result.message });
						}
					}
				}
			},
		},
		plugins: options.plugins ?? [],
	});
}

export type Auth = ReturnType<typeof createAuth>;

export const auth = createAuth({
	desktop: process.env.DEPLOY_TARGET === "desktop",
});
