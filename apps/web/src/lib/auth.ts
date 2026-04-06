import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@workspace/db/schema";
import { db } from "./db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	emailAndPassword: { enabled: true },
	advanced: {
		database: { generateId: "uuid" },
	},
	user: {
		additionalFields: {
			username: {
				type: "string",
				required: false,
				input: true,
			},
			phone: {
				type: "string",
				required: false,
				input: true,
			},
			orgId: {
				type: "string",
				required: false,
				input: false,
			},
		},
	},
});
