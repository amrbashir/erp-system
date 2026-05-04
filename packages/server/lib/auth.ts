import * as schema from "@workspace/db/schema";
import { APIError, betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { bearer } from "better-auth/plugins/bearer";

import { useDatabase } from "#db";

import { InvitationsService } from "../invitations/invitations.service.js";
import type { DB } from "../shared/db.js";
import { validatePassword } from "../shared/validate-password.js";

export interface CreateAuthOptions {
	plugins?: BetterAuthOptions["plugins"];
	desktop?: boolean;
	baseURL?: string;
	secret?: string;
	db?: DB;
}

export function createAuth(options: CreateAuthOptions = {}) {
	const db = options.db ?? useDatabase();
	const isDesktop = options.desktop ?? false;

	return betterAuth({
		baseURL:
			options.baseURL ??
			process.env.BETTER_AUTH_URL ??
			(isDesktop ? "http://localhost:11435" : undefined),
		secret: options.secret ?? process.env.BETTER_AUTH_SECRET,
		telemetry: { enabled: false },
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
				phone: {
					type: "string",
					required: false,
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 6,
			requireEmailVerification: false,
		},
		hooks: {
			// `createAuthMiddleware` is the better-auth pattern that gives
			// the handler a fully-typed `ctx` (with `.path`, `.body`, etc.).
			before: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== "/sign-up/email") return;
				const body = ctx.body as { password?: string } | undefined;
				if (!body?.password) return;
				const err = validatePassword(body.password);
				if (err) {
					throw new APIError("BAD_REQUEST", { message: err.message });
				}
			}),
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						// best-effort: consume any pending invitations for this email.
						// errors are logged but do not roll back signup.
						try {
							await new InvitationsService({ db }).consume({
								userId: user.id,
								email: user.email,
							});
						} catch (e) {
							console.error("[auth.user.create.after] consume failed:", e);
						}
					},
				},
			},
		},
		plugins: [...(isDesktop ? [bearer()] : []), ...(options.plugins ?? [])],
	});
}

export type Auth = ReturnType<typeof createAuth>;

// Lazy singleton: defer createAuth() until first access so plugins (e.g.
// desktop-startup) can populate process.env.BETTER_AUTH_SECRET / BETTER_AUTH_URL
// before auth is constructed.
let _instance: Auth | undefined;
function getInstance(): Auth {
	if (!_instance) {
		_instance = createAuth({
			desktop: process.env.DEPLOY_TARGET === "desktop",
		});
	}
	return _instance;
}

export const auth: Auth = new Proxy({} as Auth, {
	get: (_, prop) => Reflect.get(getInstance(), prop),
});
