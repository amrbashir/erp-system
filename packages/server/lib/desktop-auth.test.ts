import path from "node:path";
import { fileURLToPath } from "node:url";

import { initDatabase } from "@workspace/db/adapters/pglite";
import type { Database } from "@workspace/db/adapters/pglite";
import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll } from "vitest";

import { createOrg, getUserOrgs } from "./org.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let db: Database;
let createAuth: typeof import("./auth.js").createAuth;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
	db = await initDatabase();
	await migrate(db, { migrationsFolder });

	const mod = await import("./auth.js");
	createAuth = mod.createAuth;
	auth = createAuth({
		desktop: true,
		baseURL: "http://localhost:3000",
		secret: "test-secret-long-enough-for-validation",
	});
});

describe("desktop setup flow", () => {
	let userId = "";
	let token = "";

	it("signs up first user via BetterAuth in desktop mode", async () => {
		const res = await auth.api.signUpEmail({
			body: {
				email: "owner@local.test",
				password: "Password1",
				name: "Desktop Owner",
			},
		});

		expect(res.token).toBeDefined();
		expect(res.user.id).toBeDefined();
		expect(res.user.email).toBe("owner@local.test");
		userId = res.user.id;
		token = res.token!;
	});

	it("creates org with owner membership after signup", async () => {
		const org = await createOrg(db, {
			name: "Local Corp",
			slug: "local-corp",
			userId,
		});

		expect(org.id).toBeDefined();
		expect(org.name).toBe("Local Corp");
		expect(org.slug).toBe("local-corp");
	});

	it("user has owner role in created org", async () => {
		const orgs = await getUserOrgs(db, userId);
		expect(orgs).toHaveLength(1);
		expect(orgs[0].name).toBe("Local Corp");
		expect(orgs[0].role).toBe("owner");
	});

	it("signup token is persisted in sessions table", async () => {
		const [session] = await db
			.select()
			.from(schema.sessions)
			.where(eq(schema.sessions.token, token));
		expect(session).toBeDefined();
		expect(session.userId).toBe(userId);
	});
});
