import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { generateKeyPair, exportPKCS8, exportSPKI } from "jose";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { checkActivation, signActivationToken, verifyActivationToken } from "./activation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../db/drizzle");

let TEST_PRIVATE_KEY: string;
let TEST_PUBLIC_KEY: string;

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeAll(async () => {
	const kp = await generateKeyPair("ES256", { extractable: true });
	TEST_PRIVATE_KEY = await exportPKCS8(kp.privateKey);
	TEST_PUBLIC_KEY = await exportSPKI(kp.publicKey);

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
		const result = await checkActivation(db as any, "hw-active-001");
		expect(result.status).toBe("active");
		expect(result.activation).toBeDefined();
		expect(result.activation!.hardwareId).toBe("hw-active-001");
	});

	it("returns pending for pending hardware ID", async () => {
		const result = await checkActivation(db as any, "hw-pending-001");
		expect(result.status).toBe("pending");
		expect(result.activation).toBeUndefined();
	});

	it("returns revoked for revoked hardware ID", async () => {
		const result = await checkActivation(db as any, "hw-revoked-001");
		expect(result.status).toBe("revoked");
		expect(result.activation).toBeUndefined();
	});

	it("returns unknown for non-existent hardware ID", async () => {
		const result = await checkActivation(db as any, "hw-nonexistent");
		expect(result.status).toBe("unknown");
		expect(result.activation).toBeUndefined();
	});
});

describe("JWT signing and verification (ES256)", () => {
	it("signs with private key and verifies with public key", async () => {
		const token = await signActivationToken("hw-active-001", TEST_PRIVATE_KEY);
		expect(typeof token).toBe("string");

		const payload = await verifyActivationToken(token, TEST_PUBLIC_KEY);
		expect(payload.hardwareId).toBe("hw-active-001");
		expect(payload.activated).toBe(true);
		expect(payload.iat).toBeDefined();
	});

	it("rejects token verified with wrong public key", async () => {
		const token = await signActivationToken("hw-active-001", TEST_PRIVATE_KEY);
		const otherKp = await generateKeyPair("ES256", { extractable: true });
		const otherPublic = await exportSPKI(otherKp.publicKey);
		await expect(verifyActivationToken(token, otherPublic)).rejects.toThrow();
	});

	it("produces different tokens for different hardware IDs", async () => {
		const token1 = await signActivationToken("hw-001", TEST_PRIVATE_KEY);
		const token2 = await signActivationToken("hw-002", TEST_PRIVATE_KEY);
		expect(token1).not.toBe(token2);
	});
});
