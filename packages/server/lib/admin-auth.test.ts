import path from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll } from "vitest";

import { initDatabase } from "../adapters/pglite.js";
import type { Database } from "../adapters/pglite.js";
import { assertAdmin } from "./admin.js";

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
		baseURL: "http://localhost:3000",
		secret: "test-secret-long-enough-for-validation",
	});
});

describe("admin auth flow", () => {
	let userId = "";

	it("creates auth without desktop flag", () => {
		expect(auth).toBeDefined();
		expect(auth.api).toBeDefined();
		expect(auth.handler).toBeDefined();
	});

	it("signs up admin user via BetterAuth", async () => {
		const res = await auth.api.signUpEmail({
			body: {
				email: "admin@company.test",
				password: "password123",
				name: "Admin User",
			},
		});

		expect(res.user.id).toBeDefined();
		expect(res.user.email).toBe("admin@company.test");
		userId = res.user.id;
	});

	it("admin role check works with promoted user", async () => {
		await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, userId));

		const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));

		expect(user.role).toBe("admin");
		expect(() => assertAdmin({ user: { role: user.role } })).not.toThrow();
	});

	it("non-admin user is rejected by assertAdmin", () => {
		expect(() => assertAdmin({ user: { role: "user" } })).toThrow();
	});
});
