import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@workspace/db/schema";
import {
	listActivations,
	toggleActivationStatus,
} from "./activations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(
	__dirname,
	"../../../../packages/db/drizzle",
);

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });

	await db.insert(schema.activations).values([
		{ hardwareId: "admin-hw-001", status: "active", activatedAt: new Date() },
		{ hardwareId: "admin-hw-002", status: "pending" },
		{ hardwareId: "admin-hw-003", status: "revoked" },
	]);
});

afterAll(async () => {
	await client.close();
});

describe("listActivations", () => {
	it("returns all activations", async () => {
		const result = await listActivations(db);
		expect(result.length).toBe(3);
	});

	it("each activation has expected fields", async () => {
		const result = await listActivations(db);
		for (const a of result) {
			expect(a.id).toBeDefined();
			expect(a.hardwareId).toBeDefined();
			expect(a.status).toBeDefined();
			expect(a.createdAt).toBeInstanceOf(Date);
		}
	});
});

describe("toggleActivationStatus", () => {
	it("activates a pending hardware ID", async () => {
		const all = await listActivations(db);
		const pending = all.find((a) => a.hardwareId === "admin-hw-002")!;

		const updated = await toggleActivationStatus(db, pending.id, "active");
		expect(updated.status).toBe("active");
		expect(updated.activatedAt).toBeInstanceOf(Date);
	});

	it("revokes an active hardware ID", async () => {
		const all = await listActivations(db);
		const active = all.find((a) => a.hardwareId === "admin-hw-001")!;

		const updated = await toggleActivationStatus(db, active.id, "revoked");
		expect(updated.status).toBe("revoked");
	});

	it("re-activates a revoked hardware ID", async () => {
		const all = await listActivations(db);
		const revoked = all.find((a) => a.hardwareId === "admin-hw-003")!;

		const updated = await toggleActivationStatus(db, revoked.id, "active");
		expect(updated.status).toBe("active");
		expect(updated.activatedAt).toBeInstanceOf(Date);
	});

	it("throws for non-existent ID", async () => {
		await expect(
			toggleActivationStatus(db, "00000000-0000-0000-0000-000000000000", "active"),
		).rejects.toThrow();
	});
});
