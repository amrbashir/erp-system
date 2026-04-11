import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { listActivations, toggleActivationStatus } from "./activation.js";
import { assertAdmin } from "./admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });

	// seed activations
	await db.insert(schema.activations).values([
		{ hardwareId: "adm-hw-001", status: "active", activatedAt: new Date() },
		{ hardwareId: "adm-hw-002", status: "pending" },
		{ hardwareId: "adm-hw-003", status: "revoked" },
	]);
});

afterAll(async () => {
	await client.close();
});

// --- admin role in schema ---

describe("user admin role", () => {
	it("users default to 'user' role", async () => {
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Regular", email: "regular@test.com" })
			.returning();
		expect(user.role).toBe("user");
	});

	it("user can be created with admin role", async () => {
		const [user] = await db
			.insert(schema.users)
			.values({ name: "Admin", email: "admin@test.com", role: "admin" })
			.returning();
		expect(user.role).toBe("admin");
	});
});

// --- assertAdmin middleware ---

describe("assertAdmin", () => {
	it("throws 401 for null session", () => {
		expect(() => assertAdmin(null)).toThrow();
		try {
			assertAdmin(null);
		} catch (e: any) {
			expect(e.statusCode).toBe(401);
		}
	});

	it("throws 403 for non-admin user", () => {
		const session = { user: { id: "1", role: "user" } };
		expect(() => assertAdmin(session)).toThrow();
		try {
			assertAdmin(session);
		} catch (e: any) {
			expect(e.statusCode).toBe(403);
		}
	});

	it("passes for admin user", () => {
		const session = { user: { id: "1", role: "admin" } };
		expect(() => assertAdmin(session)).not.toThrow();
	});

	it("returns session for admin user", () => {
		const session = { user: { id: "1", role: "admin" } };
		const result = assertAdmin(session);
		expect(result).toBe(session);
	});
});

// --- admin activation functions ---

describe("listActivations", () => {
	it("returns all activations", async () => {
		const result = await listActivations(db as any);
		expect(result.length).toBe(3);
	});

	it("each activation has expected fields", async () => {
		const result = await listActivations(db as any);
		for (const a of result) {
			expect(a.id).toBeDefined();
			expect(a.hardwareId).toBeDefined();
			expect(a.status).toBeDefined();
			expect(a.createdAt).toBeInstanceOf(Date);
		}
	});
});

describe("toggleActivationStatus", () => {
	it("activates a pending activation", async () => {
		const all = await listActivations(db as any);
		const pending = all.find((a) => a.hardwareId === "adm-hw-002")!;
		const updated = await toggleActivationStatus(db as any, pending.id, "active");
		expect(updated.status).toBe("active");
		expect(updated.activatedAt).toBeInstanceOf(Date);
	});

	it("revokes an active activation", async () => {
		const all = await listActivations(db as any);
		const active = all.find((a) => a.hardwareId === "adm-hw-001")!;
		const updated = await toggleActivationStatus(db as any, active.id, "revoked");
		expect(updated.status).toBe("revoked");
	});

	it("throws for non-existent ID", async () => {
		await expect(
			toggleActivationStatus(db as any, "00000000-0000-0000-0000-000000000000", "active"),
		).rejects.toThrow();
	});
});
