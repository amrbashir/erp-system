import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@workspace/db/schema";
import {
	checkActivation,
	signActivationToken,
	verifyActivationToken,
} from "./activation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../../../packages/db/drizzle");

const TEST_SECRET = "test-secret-key-for-activation-jwt-signing";

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
	client = new PGlite();
	db = drizzle(client, { schema });
	await migrate(db, { migrationsFolder });

	// seed: one active, one pending, one revoked
	await db.insert(schema.activations).values([
		{ hardwareId: "hw-active-001", status: "active", activatedAt: new Date() },
		{ hardwareId: "hw-pending-001", status: "pending" },
		{ hardwareId: "hw-revoked-001", status: "revoked" },
	]);
});

afterAll(async () => {
	await client.close();
});

describe("checkActivation", () => {
	it("returns active + activation for activated hardware ID", async () => {
		const result = await checkActivation(db, "hw-active-001");
		expect(result.status).toBe("active");
		expect(result.activation).toBeDefined();
		expect(result.activation!.hardwareId).toBe("hw-active-001");
	});

	it("returns pending for pending hardware ID", async () => {
		const result = await checkActivation(db, "hw-pending-001");
		expect(result.status).toBe("pending");
		expect(result.activation).toBeUndefined();
	});

	it("returns revoked for revoked hardware ID", async () => {
		const result = await checkActivation(db, "hw-revoked-001");
		expect(result.status).toBe("revoked");
		expect(result.activation).toBeUndefined();
	});

	it("returns unknown for non-existent hardware ID", async () => {
		const result = await checkActivation(db, "hw-nonexistent");
		expect(result.status).toBe("unknown");
		expect(result.activation).toBeUndefined();
	});
});

describe("JWT signing and verification", () => {
	it("signs and verifies a token with correct hardware ID", async () => {
		const token = await signActivationToken("hw-active-001", TEST_SECRET);
		expect(typeof token).toBe("string");

		const payload = await verifyActivationToken(token, TEST_SECRET);
		expect(payload.hardwareId).toBe("hw-active-001");
		expect(payload.activated).toBe(true);
		expect(payload.iat).toBeDefined();
	});

	it("rejects token with wrong secret", async () => {
		const token = await signActivationToken("hw-active-001", TEST_SECRET);
		await expect(
			verifyActivationToken(token, "wrong-secret"),
		).rejects.toThrow();
	});

	it("produces different tokens for different hardware IDs", async () => {
		const token1 = await signActivationToken("hw-001", TEST_SECRET);
		const token2 = await signActivationToken("hw-002", TEST_SECRET);
		expect(token1).not.toBe(token2);
	});
});
