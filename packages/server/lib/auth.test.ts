import path from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll } from "vitest";

import { initDatabase } from "~/adapters/pglite.js";
import type { Database } from "~/adapters/pglite.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let createAuth: typeof import("./auth.js").createAuth;
let auth: ReturnType<typeof createAuth>;
let db: Database;

beforeAll(async () => {
	db = await initDatabase();
	await migrate(db, { migrationsFolder });

	// dynamic import so #db singleton is ready before auth module loads
	const mod = await import("./auth.js");
	createAuth = mod.createAuth;
	auth = createAuth({
		baseURL: "http://localhost:3000",
		secret: "test-secret-long-enough-for-validation",
	});
});

describe("createAuth", () => {
	it("returns auth instance with handler and api", () => {
		expect(auth).toBeDefined();
		expect(auth.handler).toBeInstanceOf(Function);
		expect(auth.api).toBeDefined();
		expect(auth.api.signUpEmail).toBeInstanceOf(Function);
		expect(auth.api.signInEmail).toBeInstanceOf(Function);
		expect(auth.api.getSession).toBeInstanceOf(Function);
	});
});

describe("email/password signup", () => {
	it("creates a user with UUID id", async () => {
		const res = await auth.api.signUpEmail({
			body: {
				email: "test@example.com",
				password: "password123",
				name: "Test User",
			},
		});
		expect(res.token).toBeDefined();
		expect(res.user).toBeDefined();
		expect(res.user.email).toBe("test@example.com");
		expect(res.user.name).toBe("Test User");
		expect(res.user.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});

	it("persists user in PGlite", async () => {
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.email, "test@example.com"));
		expect(user).toBeDefined();
		expect(user.name).toBe("Test User");
	});
});

describe("email/password signin", () => {
	it("signs in and creates session in DB", async () => {
		const res = await auth.api.signInEmail({
			body: {
				email: "test@example.com",
				password: "password123",
			},
		});
		expect(res.token).toBeDefined();
		expect(res.user).toBeDefined();
		expect(res.user.email).toBe("test@example.com");

		// verify session persisted in PGlite
		const [session] = await db
			.select()
			.from(schema.sessions)
			.where(eq(schema.sessions.token, res.token));
		expect(session).toBeDefined();
		expect(session.userId).toBe(res.user.id);
	});

	it("rejects invalid password", async () => {
		await expect(
			auth.api.signInEmail({
				body: {
					email: "test@example.com",
					password: "wrong",
				},
			}),
		).rejects.toThrow();
	});
});

describe("desktop mode", () => {
	it("creates auth without email verification requirement", () => {
		const desktopAuth = createAuth({
			desktop: true,
			baseURL: "http://localhost:3000",
			secret: "test-secret-long-enough-for-validation",
		});
		expect(desktopAuth).toBeDefined();
		expect(desktopAuth.api.signUpEmail).toBeInstanceOf(Function);
	});
});
