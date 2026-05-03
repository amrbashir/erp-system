import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import * as schema from "@workspace/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { generateKeyPair, exportPKCS8, exportSPKI } from "jose";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

import {
	checkActivation,
	registerHardware,
	listActivations,
	toggleActivationStatus,
	signActivationToken,
	verifyActivationToken,
} from "./activation.js";
import { ActivationNotFoundError, InvalidTokenError } from "../shared/errors.js";

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

describe("registerHardware", () => {
	it("creates a pending activation for new hardware", async () => {
		const row = await registerHardware(db as any, "hw-new-001");
		expect(row).toBeDefined();
		expect(row!.hardwareId).toBe("hw-new-001");
		expect(row!.status).toBe("pending");

		const check = await checkActivation(db as any, "hw-new-001");
		expect(check.status).toBe("pending");
	});

	it("does nothing for already-registered hardware", async () => {
		const row = await registerHardware(db as any, "hw-active-001");
		expect(row).toBeUndefined();
	});
});

describe("listActivations", () => {
	it("returns all activations", async () => {
		const result = await listActivations(db as any);
		expect(result.length).toBeGreaterThanOrEqual(3);
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
		const pending = all.find((a) => a.hardwareId === "hw-pending-001")!;
		const updated = await toggleActivationStatus(db as any, pending.id, "active");
		if (updated instanceof Error) throw updated;
		expect(updated.status).toBe("active");
		expect(updated.activatedAt).toBeInstanceOf(Date);
	});

	it("revokes an active activation", async () => {
		const all = await listActivations(db as any);
		const active = all.find((a) => a.hardwareId === "hw-active-001")!;
		const updated = await toggleActivationStatus(db as any, active.id, "revoked");
		if (updated instanceof Error) throw updated;
		expect(updated.status).toBe("revoked");
	});

	it("returns ActivationNotFoundError for non-existent ID", async () => {
		const result = await toggleActivationStatus(
			db as any,
			"00000000-0000-0000-0000-000000000000",
			"active",
		);
		expect(result).toBeInstanceOf(ActivationNotFoundError);
	});
});

describe("JWT signing and verification (ES256)", () => {
	it("signs with private key and verifies with public key", async () => {
		const token = await signActivationToken("hw-active-001", TEST_PRIVATE_KEY);
		expect(typeof token).toBe("string");
		if (token instanceof Error) throw token;

		const payload = await verifyActivationToken(token, TEST_PUBLIC_KEY);
		if (payload instanceof Error) throw payload;
		expect(payload.hardwareId).toBe("hw-active-001");
		expect(payload.activated).toBe(true);
		expect(payload.iat).toBeDefined();
	});

	it("returns InvalidTokenError when verified with wrong public key", async () => {
		const token = await signActivationToken("hw-active-001", TEST_PRIVATE_KEY);
		if (token instanceof Error) throw token;
		const otherKp = await generateKeyPair("ES256", { extractable: true });
		const otherPublic = await exportSPKI(otherKp.publicKey);
		const result = await verifyActivationToken(token, otherPublic);
		expect(result).toBeInstanceOf(InvalidTokenError);
	});

	it("produces different tokens for different hardware IDs", async () => {
		const token1 = await signActivationToken("hw-001", TEST_PRIVATE_KEY);
		const token2 = await signActivationToken("hw-002", TEST_PRIVATE_KEY);
		if (token1 instanceof Error) throw token1;
		if (token2 instanceof Error) throw token2;
		expect(token1).not.toBe(token2);
	});
});
