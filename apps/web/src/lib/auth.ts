import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@workspace/db/schema";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const db = drizzle({ client: pool, schema });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		usePlural: true,
		schema,
	}),
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
	},
	plugins: [tanstackStartCookies()],
});

export type Auth = typeof auth;
