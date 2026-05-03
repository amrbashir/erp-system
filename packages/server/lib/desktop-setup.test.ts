import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { initDatabase } from "@workspace/db/adapters/pglite";
import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { SetupAlreadyCompleteError, SlugTakenError } from "../shared/errors.js";

import { desktopSetup } from "./desktop-setup.js";
import { createOrg } from "./org.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

const authOptions = {
	baseURL: "http://localhost:3000",
	secret: "test-secret-long-enough-for-validation",
};

let createAuth: typeof import("./auth.js").createAuth;

// must init the DB singleton before importing auth.js,
// because auth.ts has a module-level createAuth() that calls useDatabase()
beforeAll(async () => {
	await initDatabase();
	const mod = await import("./auth.js");
	createAuth = mod.createAuth;
});

describe("desktopSetup – atomic success", () => {
	let client: PGlite;
	let db: ReturnType<typeof drizzle<typeof schema>>;

	beforeAll(async () => {
		client = new PGlite();
		db = drizzle(client, { schema });
		await migrate(db, { migrationsFolder });
	});

	afterAll(async () => {
		await client.close();
	});

	it("creates user + org + membership atomically", async () => {
		const result = await desktopSetup(
			db as any,
			{
				email: "setup@desktop.local",
				password: "Password1",
				name: "Setup User",
				orgName: "Setup Corp",
				slug: "setup-corp",
			},
			createAuth,
			authOptions,
		);
		if (result instanceof Error) throw result;

		expect(result.token).toBeDefined();
		expect(result.user.id).toBeDefined();
		expect(result.user.email).toBe("setup@desktop.local");
		expect(result.org.name).toBe("Setup Corp");
		expect(result.org.slug).toBe("setup-corp");

		// verify membership exists with owner role
		const [membership] = await db
			.select()
			.from(schema.orgMembers)
			.where(eq(schema.orgMembers.userId, result.user.id));
		expect(membership).toBeDefined();
		expect(membership.role).toBe("owner");
		expect(membership.orgId).toBe(result.org.id);
	});
});

describe("desktopSetup – rollback on org failure", () => {
	let client: PGlite;
	let db: ReturnType<typeof drizzle<typeof schema>>;

	beforeAll(async () => {
		client = new PGlite();
		db = drizzle(client, { schema });
		await migrate(db, { migrationsFolder });

		// pre-create a user + org with the slug we'll conflict with
		const [seedUser] = await db
			.insert(schema.users)
			.values({ name: "Seed", email: "seed@test.com" })
			.returning();
		const seedOrg = await createOrg(db as any, {
			name: "Taken Corp",
			slug: "taken-slug",
			userId: seedUser.id,
		});
		if (seedOrg instanceof Error) throw seedOrg;
		// remove seed user so the "setup already complete" check passes,
		// but keep the org so the slug conflicts
		await db.delete(schema.users).where(eq(schema.users.id, seedUser.id));
	});

	afterAll(async () => {
		await client.close();
	});

	it("rolls back user creation if org creation fails", async () => {
		const result = await desktopSetup(
			db as any,
			{
				email: "rollback@desktop.local",
				password: "Password1",
				name: "Rollback User",
				orgName: "Taken Corp 2",
				slug: "taken-slug",
			},
			createAuth,
			authOptions,
		);
		expect(result).toBeInstanceOf(SlugTakenError);

		// user should NOT exist — transaction rolled back
		const [user] = await db
			.select()
			.from(schema.users)
			.where(eq(schema.users.email, "rollback@desktop.local"));
		expect(user).toBeUndefined();
	});
});

describe("desktopSetup – existing user guard", () => {
	let client: PGlite;
	let db: ReturnType<typeof drizzle<typeof schema>>;

	beforeAll(async () => {
		client = new PGlite();
		db = drizzle(client, { schema });
		await migrate(db, { migrationsFolder });

		// run setup once to create a user
		await desktopSetup(
			db as any,
			{
				email: "first@desktop.local",
				password: "Password1",
				name: "First User",
				orgName: "First Corp",
				slug: "first-corp",
			},
			createAuth,
			authOptions,
		);
	});

	afterAll(async () => {
		await client.close();
	});

	it("second setup call returns SetupAlreadyCompleteError when user already exists", async () => {
		const result = await desktopSetup(
			db as any,
			{
				email: "second@desktop.local",
				password: "Password1",
				name: "Second User",
				orgName: "Second Corp",
				slug: "second-corp",
			},
			createAuth,
			authOptions,
		);
		expect(result).toBeInstanceOf(SetupAlreadyCompleteError);
	});
});
