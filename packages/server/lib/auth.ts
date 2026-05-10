import * as schema from "@workspace/db/schema";
import { APIError, betterAuth } from "better-auth";
import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";

import { useDatabase } from "#db";

import { InvitationsService } from "../invitations/invitations.service.js";
import type { DB } from "../shared/db.js";
import { validatePassword } from "../shared/validate-password.js";
import { DESKTOP_TRUSTED_ORIGINS } from "./desktop-origins.js";

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
		trustedOrigins: isDesktop ? [...DESKTOP_TRUSTED_ORIGINS] : undefined,
		database: drizzleAdapter(db, {
			provider: "pg",
			usePlural: true,
			schema,
		}),
		advanced: {
			database: {
				generateId: "uuid",
			},
			// Webview <-> sidecar is cross-site -> SameSite=None+Secure required. localhost is "potentially trustworthy" so Secure on http is fine.
			...(isDesktop && {
				defaultCookieAttributes: {
					sameSite: "none" as const,
					secure: true,
					partitioned: true,
				},
			}),
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
			before: createAuthMiddleware(async (ctx) => {
				if (ctx.path !== "/sign-up/email") return;
				const body = ctx.body;
				if (typeof body !== "object" || body === null || !("password" in body)) return;
				const password = body.password;
				if (typeof password !== "string") return;
				const err = validatePassword(password);
				if (err) {
					throw new APIError("BAD_REQUEST", { message: err.message });
				}
			}),
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						// Best-effort: errors logged, signup not rolled back.
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
		plugins: options.plugins ?? [],
	});
}

export type Auth = ReturnType<typeof createAuth>;

// Lazy so env vars (BETTER_AUTH_SECRET/URL) can be populated before construction.
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
